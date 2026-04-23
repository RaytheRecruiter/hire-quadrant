-- Full applicant fields captured by the expanded inline application form
-- (name split, resume upload, zip, EEO, privacy consent).
--
-- Run this in the Supabase SQL editor before deploying the form.

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS applicant_first_name text,
  ADD COLUMN IF NOT EXISTS applicant_last_name text,
  ADD COLUMN IF NOT EXISTS applicant_zip text,
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS eeo_responses jsonb,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz;
