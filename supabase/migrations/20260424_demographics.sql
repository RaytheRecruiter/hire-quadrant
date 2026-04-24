-- User EEO demographics — optional, self-reported, private by default.
CREATE TABLE IF NOT EXISTS user_demographics (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  gender text,
  race jsonb DEFAULT '[]'::jsonb,
  veteran_status text,
  disability_status text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_demographics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own demographics"
  ON user_demographics FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users upsert their own demographics"
  ON user_demographics FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update their own demographics"
  ON user_demographics FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION touch_user_demographics()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_user_demographics ON user_demographics;
CREATE TRIGGER trg_touch_user_demographics
  BEFORE UPDATE ON user_demographics
  FOR EACH ROW EXECUTE FUNCTION touch_user_demographics();
