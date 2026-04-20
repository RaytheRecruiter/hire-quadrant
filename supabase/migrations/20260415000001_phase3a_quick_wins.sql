-- Phase 3A: Saved jobs, screening questions, application view tracking

-- 1. Saved jobs table — lets candidates bookmark jobs
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved jobs"
  ON saved_jobs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can save jobs"
  ON saved_jobs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unsave jobs"
  ON saved_jobs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 2. Screening questions on jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS screening_questions jsonb DEFAULT '[]'::jsonb;

-- 3. Screening answers on applications + employer view tracking
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS screening_answers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS employer_views jsonb DEFAULT '[]'::jsonb;

-- 4. RPC to record that an employer viewed an application
CREATE OR REPLACE FUNCTION record_application_view(app_id text)
RETURNS VOID AS $$
BEGIN
  UPDATE job_applications
  SET employer_views = COALESCE(employer_views, '[]'::jsonb) || to_jsonb(now())
  WHERE id = app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
