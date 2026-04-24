-- ============================================================
-- Trust bundle: soft-delete reviews, helpful votes, PII detection,
-- auth rate-limit audit, company merge support.
-- ============================================================

-- 1. Soft-delete for reviews
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_reviews_not_deleted
  ON company_reviews(company_id, status) WHERE deleted_at IS NULL;

-- Tighten the public SELECT policy to hide soft-deleted rows
DROP POLICY IF EXISTS "Anyone reads approved reviews" ON company_reviews;
CREATE POLICY "Anyone reads approved reviews"
  ON company_reviews FOR SELECT
  USING (status = 'approved' AND deleted_at IS NULL);

-- Refresh the directory view so avg_rating / review_count exclude deleted
CREATE OR REPLACE VIEW public_company_directory AS
SELECT
  c.id, c.slug, c.name, c.display_name, c.logo, c.industry, c.size,
  c.location, c.description, c.claimed_at,
  COALESCE(j.job_count, 0) AS job_count,
  COALESCE(r.review_count, 0) AS review_count,
  COALESCE(r.avg_rating, 0)::numeric(3,2) AS avg_rating
FROM companies c
LEFT JOIN (
  SELECT company_id, COUNT(*) AS job_count FROM jobs
  WHERE company_id IS NOT NULL GROUP BY company_id
) j ON j.company_id = c.id
LEFT JOIN (
  SELECT company_id, COUNT(*) AS review_count, AVG(rating_overall) AS avg_rating
  FROM company_reviews WHERE status = 'approved' AND deleted_at IS NULL GROUP BY company_id
) r ON r.company_id = c.id
WHERE c.is_active = true
  AND (COALESCE(j.job_count, 0) > 0 OR COALESCE(r.review_count, 0) > 0);

-- 2. Helpful votes
CREATE TABLE IF NOT EXISTS company_review_votes (
  review_id uuid NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_helpful boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (review_id, user_id)
);

ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS helpful_count int NOT NULL DEFAULT 0;
ALTER TABLE company_reviews ADD COLUMN IF NOT EXISTS unhelpful_count int NOT NULL DEFAULT 0;

ALTER TABLE company_review_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads vote aggregates" ON company_review_votes FOR SELECT USING (true);
CREATE POLICY "Users vote once each" ON company_review_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users change their vote" ON company_review_votes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users retract vote" ON company_review_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Denormalized counters kept fresh via trigger
CREATE OR REPLACE FUNCTION fn_sync_review_vote_counts()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE company_reviews
    SET helpful_count = (SELECT COUNT(*) FROM company_review_votes WHERE review_id = OLD.review_id AND is_helpful),
        unhelpful_count = (SELECT COUNT(*) FROM company_review_votes WHERE review_id = OLD.review_id AND NOT is_helpful)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  UPDATE company_reviews
  SET helpful_count = (SELECT COUNT(*) FROM company_review_votes WHERE review_id = NEW.review_id AND is_helpful),
      unhelpful_count = (SELECT COUNT(*) FROM company_review_votes WHERE review_id = NEW.review_id AND NOT is_helpful)
  WHERE id = NEW.review_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_review_vote_counts ON company_review_votes;
CREATE TRIGGER trg_sync_review_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON company_review_votes
  FOR EACH ROW EXECUTE FUNCTION fn_sync_review_vote_counts();

-- 3. PII leak detection (email / phone in review body)
CREATE OR REPLACE FUNCTION fn_detect_review_pii()
RETURNS trigger AS $$
DECLARE _haystack text;
BEGIN
  _haystack := COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.pros, '') || ' ' || COALESCE(NEW.cons, '');
  -- Email: basic RFC-ish pattern
  IF _haystack ~* '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' THEN
    -- Auto-flag — force back to pending even if the user edited away from a
    -- previously-approved version. Reviewers see a note via rejected_reason.
    NEW.status = 'pending';
    NEW.rejected_reason = COALESCE(NEW.rejected_reason, 'Awaiting review: contains an email address');
  END IF;
  -- US phone number
  IF _haystack ~ '(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}' THEN
    NEW.status = 'pending';
    NEW.rejected_reason = COALESCE(NEW.rejected_reason, 'Awaiting review: contains a phone number');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_detect_review_pii ON company_reviews;
CREATE TRIGGER trg_detect_review_pii
  BEFORE INSERT OR UPDATE OF title, pros, cons ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION fn_detect_review_pii();

-- 4. Auth rate-limit: track per-email failed attempts, 10 per hour cap.
--    Supabase already rate-limits at the provider level but we add an
--    application-level counter for dashboards + forensics.
CREATE TABLE IF NOT EXISTS auth_attempts (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  ip_address inet,
  succeeded boolean NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_time
  ON auth_attempts(LOWER(email), created_at DESC);

ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins read attempts" ON auth_attempts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
-- Anyone can INSERT (the login page fires this); restrict in RPC layer instead.
CREATE POLICY "Anyone records attempts" ON auth_attempts FOR INSERT WITH CHECK (true);

-- 5. Company merge — superseded_by column so admins can point dup rows at
--    a canonical id without deleting (preserves referential integrity for
--    any jobs/reviews still linked to the dup).
ALTER TABLE companies ADD COLUMN IF NOT EXISTS superseded_by uuid
  REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_companies_superseded_by ON companies(superseded_by)
  WHERE superseded_by IS NOT NULL;

-- Helper RPC: migrate a duplicate's jobs/reviews/admins/updates to the
-- canonical company and mark it superseded. Admin-only.
CREATE OR REPLACE FUNCTION merge_companies(duplicate_id uuid, canonical_id uuid)
RETURNS jsonb AS $$
DECLARE
  _is_admin boolean;
  _moved jsonb := '{}'::jsonb;
BEGIN
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  INTO _is_admin;
  IF NOT _is_admin THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;
  IF duplicate_id = canonical_id THEN
    RETURN jsonb_build_object('error', 'same_id');
  END IF;

  UPDATE jobs SET company_id = canonical_id WHERE company_id = duplicate_id;
  GET DIAGNOSTICS _moved = ROW_COUNT;

  UPDATE company_reviews SET company_id = canonical_id WHERE company_id = duplicate_id;
  UPDATE company_review_responses SET company_id = canonical_id WHERE company_id = duplicate_id;
  UPDATE company_updates SET company_id = canonical_id WHERE company_id = duplicate_id;
  UPDATE company_questions SET company_id = canonical_id WHERE company_id = duplicate_id;
  UPDATE company_content_blocks SET company_id = canonical_id WHERE company_id = duplicate_id;
  UPDATE company_followers SET company_id = canonical_id WHERE company_id = duplicate_id
    AND NOT EXISTS (SELECT 1 FROM company_followers cf WHERE cf.company_id = canonical_id AND cf.user_id = company_followers.user_id);
  DELETE FROM company_followers WHERE company_id = duplicate_id;
  UPDATE company_admins SET company_id = canonical_id WHERE company_id = duplicate_id
    AND NOT EXISTS (SELECT 1 FROM company_admins ca WHERE ca.company_id = canonical_id AND ca.user_id = company_admins.user_id);
  DELETE FROM company_admins WHERE company_id = duplicate_id;

  UPDATE companies SET superseded_by = canonical_id, is_active = false
  WHERE id = duplicate_id;

  INSERT INTO audit_log (actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(), 'company.merge', 'company', duplicate_id::text,
    jsonb_build_object('canonical_id', canonical_id)
  );

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION merge_companies(uuid, uuid) TO authenticated;
