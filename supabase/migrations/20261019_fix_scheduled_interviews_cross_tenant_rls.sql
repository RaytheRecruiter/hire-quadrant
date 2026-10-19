-- CRITICAL, found auditing interview-prep (2026-10-19): scheduled_interviews'
-- read and write policies both only checked "is the caller ANY company-role
-- user" (user_profiles.role in ('admin','company')), with zero check that
-- the application being scheduled against actually belongs to a job this
-- company owns. Confirmed live via pg_policies. Net effect: any employer
-- could read or write (insert/update/delete) another company's scheduled
-- interviews -- candidate names, meeting links, interview notes, and the
-- ability to tamper with another company's interview schedule.
--
-- Fix: scope through the same relational path already fixed for
-- job_applications in 20261018_fix_company_applications_rls.sql --
-- scheduled_interviews.application_id -> job_applications.job_id ->
-- jobs.company_id -> company_members (active) or the legacy
-- user_profiles.company_id fallback for pre-company_members accounts.
-- Admins keep full access; candidates keep read-only access to their own
-- interviews.

DROP POLICY IF EXISTS "scheduled_interviews_read" ON scheduled_interviews;
DROP POLICY IF EXISTS "scheduled_interviews_write" ON scheduled_interviews;

CREATE POLICY "scheduled_interviews_read"
  ON scheduled_interviews FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_applications a
      WHERE a.id = scheduled_interviews.application_id
        AND a.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM job_applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN company_members cm ON cm.company_id = j.company_id
      WHERE a.id = scheduled_interviews.application_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM job_applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN user_profiles up ON up.company_id = j.company_id
      WHERE a.id = scheduled_interviews.application_id
        AND up.id = auth.uid()
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );

CREATE POLICY "scheduled_interviews_write"
  ON scheduled_interviews FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM job_applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN company_members cm ON cm.company_id = j.company_id
      WHERE a.id = scheduled_interviews.application_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM job_applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN user_profiles up ON up.company_id = j.company_id
      WHERE a.id = scheduled_interviews.application_id
        AND up.id = auth.uid()
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM job_applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN company_members cm ON cm.company_id = j.company_id
      WHERE a.id = scheduled_interviews.application_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM job_applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN user_profiles up ON up.company_id = j.company_id
      WHERE a.id = scheduled_interviews.application_id
        AND up.id = auth.uid()
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );
