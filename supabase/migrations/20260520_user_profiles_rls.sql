-- Per Supabase Advisor 2026-05-20 (forwarded by Ray): user_profiles had
-- RLS disabled in public schema. That made every signup row (id, name,
-- email, role, company_id, is_approved, avatar_url) publicly readable AND
-- writable to anyone with the project URL. Re-enable RLS and install the
-- canonical policies the app already depends on.
--
-- The original CREATE TABLE migration (20250728193212_floating_cake.sql)
-- enabled RLS — it must have been turned off later via the dashboard or a
-- subsequent migration. This file is idempotent so it's safe to leave in
-- the history.

-- ─── Helper: is the caller a super admin? ─────────────────────────────────
-- SECURITY DEFINER so we don't get recursive policy evaluation when other
-- policies on user_profiles reference admin status.
create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
grant execute on function is_super_admin() to authenticated;

-- ─── Enable RLS ───────────────────────────────────────────────────────────
alter table user_profiles enable row level security;

-- ─── Self access ──────────────────────────────────────────────────────────
drop policy if exists "Users can read own profile" on user_profiles;
create policy "Users can read own profile"
  on user_profiles for select to authenticated
  using (id = auth.uid());

drop policy if exists "Users can insert own profile" on user_profiles;
create policy "Users can insert own profile"
  on user_profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "Users can update own profile" on user_profiles;
create policy "Users can update own profile"
  on user_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ─── Super-admin access ───────────────────────────────────────────────────
drop policy if exists "Admins can read all profiles" on user_profiles;
create policy "Admins can read all profiles"
  on user_profiles for select to authenticated
  using (is_super_admin());

drop policy if exists "Admins can update all profiles" on user_profiles;
create policy "Admins can update all profiles"
  on user_profiles for update to authenticated
  using (is_super_admin())
  with check (is_super_admin());

-- ─── Company members read teammates ───────────────────────────────────────
-- Needed by /company-dashboard/team, Subscription Manager Owner column,
-- Recruiter Activity panel, and any other surface that lists fellow
-- members of the caller's company.
drop policy if exists "Company members read teammates" on user_profiles;
create policy "Company members read teammates"
  on user_profiles for select to authenticated
  using (exists (
    select 1
    from company_members me
    join company_members them on them.company_id = me.company_id
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = user_profiles.id
  ));

-- ─── Employers read applicant profiles ────────────────────────────────────
-- Needed for the Applicants tab to render name + email per applicant row.
-- Scoped strictly to applicants of the caller's company's jobs.
drop policy if exists "Employers read applicant profiles" on user_profiles;
create policy "Employers read applicant profiles"
  on user_profiles for select to authenticated
  using (exists (
    select 1
    from job_applications ja
    join jobs j on j.id = ja.job_id
    join user_profiles me on me.id = auth.uid()
    where ja.user_id = user_profiles.id
      and j.company_id = me.company_id
      and me.role = 'company'
  ));
