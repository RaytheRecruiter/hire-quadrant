-- Repair pass for Ray's "Could not submit application" report (2026-08-12).
-- Root cause could not be confirmed against prod (no DB credentials in this
-- session), so this migration is a defensive, fully idempotent pass that:
--   1. Re-asserts every column the application INSERT writes to exists
--      (in case one of the 2026-04-23 migrations was never run in prod).
--   2. Re-asserts the candidate INSERT policy on job_applications.
--   3. Fixes a real mismatch found in code review: the resumes storage
--      bucket caps uploads at 10MB and only allows pdf/doc/docx, but the
--      apply form advertises "Max. file size: 50 MB" and also accepts
--      .txt. Any candidate uploading a 10-50MB file, or a .txt file,
--      would silently fail at the storage step.
-- Safe to run even if nothing here was actually broken.

-- 1. Columns -----------------------------------------------------------
ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS applicant_first_name text,
  ADD COLUMN IF NOT EXISTS applicant_last_name text,
  ADD COLUMN IF NOT EXISTS applicant_phone text,
  ADD COLUMN IF NOT EXISTS applicant_zip text,
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS cover_letter text,
  ADD COLUMN IF NOT EXISTS eeo_responses jsonb,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS screening_answers jsonb DEFAULT '[]'::jsonb;

ALTER TABLE job_applications ALTER COLUMN user_name DROP NOT NULL;
ALTER TABLE job_applications ALTER COLUMN user_email DROP NOT NULL;

-- 2. INSERT policy -------------------------------------------------------
DROP POLICY IF EXISTS "Users can create own applications" ON job_applications;
CREATE POLICY "Users can create own applications"
  ON job_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Resume upload bucket limits -----------------------------------------
UPDATE storage.buckets
  SET file_size_limit = 52428800, -- 50MB, matches the form's stated limit
      allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ]
  WHERE id = 'resumes';
