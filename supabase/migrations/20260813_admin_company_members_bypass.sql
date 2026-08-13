-- Ray: "Admins need to be able to control the full functionality of
-- companies. (Take down jobs, remove users from company, etc.)"
--
-- jobs already has an "Admins can manage jobs" FOR ALL policy from
-- 20260407000004_fix_jobs_rls_policy.sql, so admins closing/editing any
-- company's jobs already works at the RLS layer.
--
-- company_members had no admin bypass at all on SELECT or WRITE — only
-- "is a member of this specific company" (is_company_member /
-- is_company_owner_or_admin). This is also a real gap in the Subscription
-- Manager's "Primary User" lookup shipped in
-- 20260812_subscription_manager_owner_fixes.sql: that panel reads
-- company_members for every company, but a real logged-in HireQuadrant
-- admin (who isn't a company_members row anywhere) would get zero rows
-- back under the old SELECT policy. Same fix pattern already used for
-- company_invitations and company_team_invites.

drop policy if exists "members_company_select" on company_members;
create policy "members_company_select"
  on company_members for select to authenticated
  using (
    is_company_member(company_id)
    or exists (select 1 from user_profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "members_owner_admin_write" on company_members;
create policy "members_owner_admin_write"
  on company_members for all
  to authenticated
  using (
    is_company_owner_or_admin(company_id, auth.uid())
    or exists (select 1 from user_profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    is_company_owner_or_admin(company_id, auth.uid())
    or exists (select 1 from user_profiles p where p.id = auth.uid() and p.role = 'admin')
  );
