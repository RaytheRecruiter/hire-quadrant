-- ============================================================================
-- Phase 2: Job skips table for personalized recommendations
-- ============================================================================
-- Tracks jobs that users have marked as "Not Interested"
-- Used to exclude skipped jobs from recommendations and apply negative weight

CREATE TABLE IF NOT EXISTS job_skips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skipped_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE job_skips ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own skips
CREATE POLICY "Users can insert own skips"
  ON job_skips FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own skips
CREATE POLICY "Users can read own skips"
  ON job_skips FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete (unskip) their own skips
CREATE POLICY "Users can delete own skips"
  ON job_skips FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
