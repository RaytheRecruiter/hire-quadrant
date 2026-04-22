-- ============================================================================
-- Phase 4: Career Navigation Engine
-- ============================================================================
-- Caches Claude-generated career paths per job title
-- Stores user career goals and current role for personalization

CREATE TABLE IF NOT EXISTS career_path_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title text NOT NULL,
  paths jsonb NOT NULL,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(job_title)
);

ALTER TABLE career_path_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read career paths"
  ON career_path_cache FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Service role can insert career paths"
  ON career_path_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update career paths"
  ON career_path_cache FOR UPDATE
  WITH CHECK (true);

-- User career settings
CREATE TABLE IF NOT EXISTS user_career_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_role text,
  target_role text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_career_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own career settings"
  ON user_career_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
