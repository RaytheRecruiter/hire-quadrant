-- CRITICAL, confirmed live via N19 QA (2026-10-18): employers can never
-- download a candidate's resume, at all, even for a candidate who applied
-- directly to their own job posting. "Download Resume" calls
-- storage.createSignedUrl() and gets "Object not found" -- confirmed via
-- service-role listing that the file genuinely exists at that exact path,
-- so this is a storage-policy gap, not a missing file.
--
-- Root cause: the resumes bucket (20260407000002_create_resumes_storage.sql)
-- was designed only for a candidate's own self-service resume management
-- (its own comment says so explicitly: "Candidates can upload to their own
-- folder / Candidates can read their own files / Admins can read all
-- files") and was never extended to let an employer read a resume attached
-- to an application for their own job -- a day-one gap in the original
-- design, not a regression. Supabase Storage RLS on storage.objects is
-- entirely separate from table RLS, so fixing job_applications access
-- (20261018_fix_company_applications_rls.sql) didn't touch this.
--
-- Scoped tightly: only resumes actually attached to an application
-- (job_applications.resume_url) for a job the company owns -- not candidate
-- profile resumes in general, which stay candidate-only/admin-only as
-- originally designed.

CREATE POLICY "Company members can read applicant resumes"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (
      EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN jobs j ON j.id = ja.job_id
        JOIN company_members cm ON cm.company_id = j.company_id
        WHERE ja.resume_url = storage.objects.name
          AND cm.user_id = auth.uid()
          AND cm.status = 'active'
      )
      OR EXISTS (
        SELECT 1 FROM job_applications ja
        JOIN jobs j ON j.id = ja.job_id
        JOIN user_profiles up ON up.company_id = j.company_id
        WHERE ja.resume_url = storage.objects.name
          AND up.id = auth.uid()
          AND up.role = 'company'
          AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
      )
    )
  );
