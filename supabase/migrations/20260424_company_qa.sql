-- Company Q&A — candidates ask, employers answer.
-- Public read; auth to ask; only the company's admins answer their own.
CREATE TABLE IF NOT EXISTS company_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  asker_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  answer_body text,
  answerer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  answered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_questions_company
  ON company_questions(company_id, answered_at DESC NULLS LAST, created_at DESC);

ALTER TABLE company_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads company questions"
  ON company_questions FOR SELECT USING (true);

CREATE POLICY "Authenticated users ask questions"
  ON company_questions FOR INSERT TO authenticated
  WITH CHECK (
    asker_id = auth.uid()
    AND answer_body IS NULL
    AND answerer_id IS NULL
  );

CREATE POLICY "Askers edit their own question text"
  ON company_questions FOR UPDATE TO authenticated
  USING (asker_id = auth.uid() AND answer_body IS NULL)
  WITH CHECK (asker_id = auth.uid() AND answer_body IS NULL);

CREATE POLICY "Company admins answer"
  ON company_questions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_admins.company_id = company_questions.company_id
      AND company_admins.user_id = auth.uid()
  ))
  WITH CHECK (
    answerer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM company_admins
      WHERE company_admins.company_id = company_questions.company_id
        AND company_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins manage questions"
  ON company_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE OR REPLACE FUNCTION touch_company_question()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.answer_body IS DISTINCT FROM OLD.answer_body AND NEW.answer_body IS NOT NULL THEN
    NEW.answered_at = COALESCE(NEW.answered_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_company_question ON company_questions;
CREATE TRIGGER trg_touch_company_question
  BEFORE UPDATE ON company_questions
  FOR EACH ROW EXECUTE FUNCTION touch_company_question();
