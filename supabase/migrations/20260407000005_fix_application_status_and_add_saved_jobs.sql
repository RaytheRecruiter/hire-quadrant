/*
  # Fix application status values and add saved_jobs table

  1. Fix status CHECK constraint
     - Code uses: 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'
     - Database allowed: 'pending', 'reviewed', 'accepted', 'rejected'
     - Update to match the code's values

  2. Make user_name and user_email nullable
     - The application INSERT doesn't always have these values
     - They can be populated from the user's profile

  3. New Table: saved_jobs
     - Allows candidates to bookmark jobs for later
*/

-- Fix the status CHECK constraint to match the code
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check
  CHECK (status IN ('Applied', 'Screening', 'Interview', 'Offer', 'Rejected'));

-- Update the default status to match code
ALTER TABLE job_applications ALTER COLUMN status SET DEFAULT 'Applied';

-- Make user_name and user_email nullable since they're not always provided
ALTER TABLE job_applications ALTER COLUMN user_name DROP NOT NULL;
ALTER TABLE job_applications ALTER COLUMN user_email DROP NOT NULL;

-- Create saved_jobs table for bookmarking
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own saved jobs
CREATE POLICY "Users can read own saved jobs"
  ON saved_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can save jobs
CREATE POLICY "Users can save jobs"
  ON saved_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can unsave jobs
CREATE POLICY "Users can unsave jobs"
  ON saved_jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
