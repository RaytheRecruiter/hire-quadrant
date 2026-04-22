-- ============================================================================
-- Phase 3: AI job match score cache table
-- ============================================================================
-- Stores Claude-generated match scores (0-100) for resume vs job descriptions
-- Cached to avoid recomputing scores on every page load

CREATE TABLE IF NOT EXISTS job_match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  match_score int NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  matching_skills text[],
  computed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE job_match_scores ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own match scores
CREATE POLICY "Users can read own match scores"
  ON job_match_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Service role (Edge Function) can insert match scores
CREATE POLICY "Service role can insert match scores"
  ON job_match_scores FOR INSERT
  WITH CHECK (true);
