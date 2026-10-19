-- HOTFIX: /jobs and any other page that joins user_profiles fails with
-- "infinite recursion detected in policy for relation user_profiles".
--
-- The "Employers read applicant profiles" policy installed in PR #105
-- joins user_profiles on itself inside the USING clause:
--
--   using (exists (
--     select 1
--     from job_applications ja
--     join jobs j on j.id = ja.job_id
--     join user_profiles me on me.id = auth.uid()   ← self-reference
--     where ja.user_id = user_profiles.id ...
--   ))
--
-- When PG evaluates this policy for a SELECT on user_profiles, the
-- subquery touches user_profiles again, which re-runs the policies,
-- which re-runs this policy, until PG aborts with a recursion error.
--
-- Fix: lift the subquery into a SECURITY DEFINER function (runs as
-- postgres → bypasses RLS → no recursion), same pattern is_super_admin()
-- already uses successfully.

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

drop policy if exists "Employers read applicant profiles" on user_profiles;
create policy "Employers read applicant profiles"
  on user_profiles for select to authenticated
  using (is_employer_for_applicant(id));
