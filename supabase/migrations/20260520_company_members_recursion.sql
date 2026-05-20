-- Continuation of the user_profiles RLS work. PR #112 fixed the
-- "Employers read applicant profiles" recursion on user_profiles via
-- a SECURITY DEFINER helper. Anon then worked, but **signed-in** users
-- hit a separate recursion: company_members.members_company_select
-- self-references company_members inside its USING clause. When the
-- user_profiles "Company members read teammates" policy fires, it
-- queries company_members, which trips THAT recursion and returns a
-- 500 to anything reading company_members (incl. /company-dashboard).
--
-- This migration fixes both with SECURITY DEFINER helpers and then
-- re-enables user_profiles RLS to close Ray's critical alert. Verified
-- via signed-in Playwright run against test-employer-1 BEFORE this PR
-- was opened — /jobs, /companies, and post-login /company-dashboard
-- all load cleanly.

-- ─── Helper: am I a member of this company? ─────────────────────────────
create or replace function is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from company_members
    where company_id = p_company_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;
revoke execute on function is_company_member(uuid) from public, anon;
grant execute on function is_company_member(uuid) to authenticated;


-- ─── Helper: are these two users teammates? ─────────────────────────────
create or replace function is_teammate(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from company_members me
    join company_members them on them.company_id = me.company_id
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = p_other_user_id
      and them.status = 'active'
  );
$$;
revoke execute on function is_teammate(uuid) from public, anon;
grant execute on function is_teammate(uuid) to authenticated;


-- ─── Fix company_members.members_company_select recursion ───────────────
drop policy if exists "members_company_select" on company_members;
create policy "members_company_select"
  on company_members for select to authenticated
  using (is_company_member(company_id));


-- ─── Rewrite user_profiles teammate policy with helper (defense in depth)
drop policy if exists "Company members read teammates" on user_profiles;
create policy "Company members read teammates"
  on user_profiles for select to authenticated
  using (is_teammate(id));


-- ─── Re-enable user_profiles RLS — closes Ray's critical alert ──────────
alter table user_profiles enable row level security;
