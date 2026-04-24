-- Why Join Us — employer-editable content blocks rendered on company profile.
CREATE TABLE IF NOT EXISTS company_content_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'text' CHECK (kind IN ('text', 'image', 'video', 'quote', 'stat')),
  heading text,
  body text,
  image_url text,
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_blocks_company
  ON company_content_blocks(company_id, position);

ALTER TABLE company_content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads content blocks"
  ON company_content_blocks FOR SELECT USING (true);

CREATE POLICY "Company admins manage content blocks"
  ON company_content_blocks FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_admins.company_id = company_content_blocks.company_id
      AND company_admins.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_admins.company_id = company_content_blocks.company_id
      AND company_admins.user_id = auth.uid()
  ));

CREATE POLICY "Super admins manage content blocks"
  ON company_content_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION touch_content_block()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_content_block ON company_content_blocks;
CREATE TRIGGER trg_touch_content_block
  BEFORE UPDATE ON company_content_blocks
  FOR EACH ROW EXECUTE FUNCTION touch_content_block();
