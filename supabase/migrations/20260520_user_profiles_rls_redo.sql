-- Re-enable user_profiles RLS — this time without the recursion bug.
--
-- Timeline:
--   1. PR #105 originally re-enabled RLS w/ a recursive "Employers
--      read applicant profiles" policy that joined user_profiles to
--      itself inside its USING clause.
--   2. /jobs broke for any non-admin user because every join to
--      user_profiles hit the recursion.
--   3. We disabled RLS to unblock the site — which re-opened Ray's
--      original critical advisor alert "rls_disabled_in_public".
--   4. This migration installs the policies correctly: the recursive
--      subquery is lifted into a SECURITY DEFINER helper function
--      (same pattern is_super_admin() uses) so the policy can no
--      longer trigger itself, and RLS is re-enabled.
--
-- Other policies from PR #105 are still defined on the table (we only
-- disabled RLS earlier; never dropped policies). This migration is
-- safe to re-run.

-- ─── Helper: is the caller an employer of this applicant? ───────────────
-- SECURITY DEFINER → runs as postgres → bypasses RLS on user_profiles
-- → cannot recurse into the policy that calls it.
create or replace function is_employer_for_applicant(p_applicant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from job_applications ja
    join jobs j on j.id = ja.job_id
    join user_profiles me on me.id = auth.uid()
    where ja.user_id = p_applicant_id
      and j.company_id = me.company_id
      and me.role = 'company'
  );
$$;

revoke execute on function is_employer_for_applicant(uuid) from public, anon;
grant execute on function is_employer_for_applicant(uuid) to authenticated;


-- ─── Replace the recursive policy ───────────────────────────────────────
drop policy if exists "Employers read applicant profiles" on user_profiles;
create policy "Employers read applicant profiles"
  on user_profiles for select to authenticated
  using (is_employer_for_applicant(id));


-- ─── Re-enable RLS ──────────────────────────────────────────────────────
-- Closes Ray's "rls_disabled_in_public" critical alert.
alter table user_profiles enable row level security;
