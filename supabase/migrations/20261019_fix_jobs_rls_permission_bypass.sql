-- CRITICAL, found auditing the employer job-posting flow (2026-10-19):
-- jobs' INSERT/UPDATE/DELETE policies (20260428_employer_jobs_rls.sql)
-- check only user_profiles.company_id/role/is_approved -- there is no
-- awareness of company_members (the real team/permissions table, which
-- shipped the very next day, 2026-04-29, and was never backported here).
--
-- Confirmed by reading CompanyJobsList.tsx: the UI's own intended access
-- model is `noMember || isOwner || isAdmin || can('post_jobs')` for
-- posting and `can('edit_jobs')` for editing/deleting -- i.e. a
-- "Standard" team member with post_jobs/edit_jobs turned off should not
-- be able to create or touch jobs, and a *deactivated* team member
-- (company_members.status = 'inactive', the exact mechanism
-- TeamMembers.tsx's "Deactivate" button uses, per its own comment:
-- "Inactive members keep their record + permissions but the
-- effectivePermissions() helper returns all-false until reactivated")
-- should not be able to touch anything at all.
--
-- None of that is enforced in the database. Since this policy only
-- checks user_profiles (role='company', is_approved=true,
-- company_id matches) with no reference to company_members.status or
-- .permissions, any authenticated company user -- including a Standard
-- member with post_jobs/edit_jobs explicitly disabled, or someone who
-- was just deactivated by their own company's Owner -- could post, edit,
-- or delete any job for that company via a direct API call, completely
-- bypassing the permission system the UI presents. A fired recruiter's
-- still-valid session could keep posting or deleting jobs after being
-- deactivated.
--
-- Fixed by checking company_members (status='active', owner/admin
-- bypass, or the specific permission flag) with the same legacy
-- user_profiles fallback used in every other fix this cycle. Preserves
-- the original asymmetry where only INSERT checked is_approved.

DROP POLICY IF EXISTS "Employers can insert their own jobs" ON jobs;
CREATE POLICY "Employers can insert their own jobs"
  ON jobs FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = jobs.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND (cm.role IN ('owner', 'admin') OR (cm.permissions->>'post_jobs')::boolean IS TRUE)
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.company_id = jobs.company_id
        AND up.role = 'company'
        AND up.is_approved = true
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );

DROP POLICY IF EXISTS "Employers can update their own jobs" ON jobs;
CREATE POLICY "Employers can update their own jobs"
  ON jobs FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = jobs.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND (cm.role IN ('owner', 'admin') OR (cm.permissions->>'edit_jobs')::boolean IS TRUE)
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.company_id = jobs.company_id
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = jobs.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND (cm.role IN ('owner', 'admin') OR (cm.permissions->>'edit_jobs')::boolean IS TRUE)
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.company_id = jobs.company_id
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );

DROP POLICY IF EXISTS "Employers can delete their own jobs" ON jobs;
CREATE POLICY "Employers can delete their own jobs"
  ON jobs FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_members cm
      WHERE cm.company_id = jobs.company_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
        AND (cm.role IN ('owner', 'admin') OR (cm.permissions->>'edit_jobs')::boolean IS TRUE)
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
        AND up.company_id = jobs.company_id
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );
