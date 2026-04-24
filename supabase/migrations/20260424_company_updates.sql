-- ============================================================
-- Phase 6: Company updates feed
-- Employers post short announcements ("updates") that render on
-- their public profile and in the feeds of their followers (future).
-- ============================================================

CREATE TABLE IF NOT EXISTS company_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_updates_company
  ON company_updates(company_id, pinned DESC, published_at DESC);

ALTER TABLE company_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads company updates"
  ON company_updates FOR SELECT USING (true);

CREATE POLICY "Company admins manage updates"
  ON company_updates FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_admins.company_id = company_updates.company_id
      AND company_admins.user_id = auth.uid()
  ))
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM company_admins
      WHERE company_admins.company_id = company_updates.company_id
        AND company_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins manage updates"
  ON company_updates FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION touch_company_update()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_company_update ON company_updates;
CREATE TRIGGER trg_touch_company_update
  BEFORE UPDATE ON company_updates
  FOR EACH ROW EXECUTE FUNCTION touch_company_update();
