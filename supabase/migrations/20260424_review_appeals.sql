-- Review appeals: rejected-review authors can ask a moderator to reconsider.
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS appeal_text text;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS appeal_submitted_at timestamptz;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS appeal_status text
  DEFAULT 'none'
  CHECK (appeal_status IN ('none', 'pending', 'approved', 'rejected'));

-- Allow the author of a rejected review to write the appeal fields.
-- Existing author-update policy already permits updates by author, but it
-- also enforces status='pending' in WITH CHECK, which blocks setting
-- appeal_text on a rejected row. Add a dedicated appeal-write policy.
DROP POLICY IF EXISTS "Authors submit appeals on rejected reviews" ON company_reviews;
CREATE POLICY "Authors submit appeals on rejected reviews"
  ON company_reviews FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status = 'rejected')
  WITH CHECK (author_id = auth.uid() AND status = 'rejected' AND appeal_status IN ('none', 'pending'));

CREATE INDEX IF NOT EXISTS idx_reviews_appeal_pending
  ON company_reviews(appeal_submitted_at DESC)
  WHERE appeal_status = 'pending';
