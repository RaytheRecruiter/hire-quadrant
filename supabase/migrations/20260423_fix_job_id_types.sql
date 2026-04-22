-- Fix UUID vs TEXT type mismatches in job_id foreign keys
-- jobs.id is TEXT, but saved_jobs.job_id and job_views.job_id were created as UUID
-- This causes silent foreign key constraint failures

-- Save existing data from saved_jobs
CREATE TEMP TABLE saved_jobs_backup AS SELECT * FROM saved_jobs;

-- Drop constraint and recreate saved_jobs with correct type
ALTER TABLE saved_jobs DROP CONSTRAINT IF EXISTS saved_jobs_job_id_fkey;
ALTER TABLE saved_jobs ALTER COLUMN job_id TYPE text USING job_id::text;
ALTER TABLE saved_jobs ADD CONSTRAINT saved_jobs_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Save existing data from job_views
CREATE TEMP TABLE job_views_backup AS SELECT * FROM job_views;

-- Drop constraint and recreate job_views with correct type
ALTER TABLE job_views DROP CONSTRAINT IF EXISTS job_views_job_id_fkey;
ALTER TABLE job_views ALTER COLUMN job_id TYPE text USING job_id::text;
ALTER TABLE job_views ADD CONSTRAINT job_views_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Verify all job_id columns are now TEXT
-- This ensures consistency: jobs.id is TEXT, all references are TEXT
