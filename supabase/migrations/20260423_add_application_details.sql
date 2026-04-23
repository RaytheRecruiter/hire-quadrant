-- Add applicant-provided fields captured by the new inline application form
-- on job detail pages (PR #11 + this migration).
--
-- The form lets a candidate write a cover letter and override their phone
-- number per-application. Both are optional. Employers reading the
-- application in CompanyApplicants / Admin can display them alongside
-- screening answers.

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS cover_letter text,
  ADD COLUMN IF NOT EXISTS applicant_phone text;
