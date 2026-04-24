-- ============================================================
-- Phase 5.5: Review reports (abuse/spam flags) + rate limiting
--
-- 1. company_review_reports — users can flag reviews for moderator
--    attention with a reason category + optional note.
-- 2. can_submit_review(user_id) helper — enforces a 24h window
--    cap on new review submissions across all companies, layered
--    on top of the existing 1-per-company UNIQUE.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Review reports
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_review_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES company_reviews(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN (
    'spam', 'abuse', 'fake', 'off_topic', 'conflict_of_interest', 'other'
  )),
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'actioned', 'dismissed')),
  decided_at timestamptz,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (review_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_review_reports_review ON company_review_reports(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON company_review_reports(status) WHERE status = 'open';

ALTER TABLE company_review_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own reports"
  ON company_review_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

CREATE POLICY "Super admins read all reports"
  ON company_review_reports FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users report reviews"
  ON company_review_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND status = 'open');

CREATE POLICY "Super admins decide reports"
  ON company_review_reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ------------------------------------------------------------
-- 2. Rate-limit helper: caps new review submissions at 3 per
--    24h per user across all companies (the per-company UNIQUE
--    constraint is still in effect). Exposed as an RPC so the
--    client can query before rendering the form and surface a
--    friendly message instead of a generic RLS denial.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_submit_review()
RETURNS jsonb AS $$
DECLARE
  _user_id uuid := auth.uid();
  _recent_count int;
  _cap int := 3;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'not_authenticated');
  END IF;

  SELECT COUNT(*) INTO _recent_count
  FROM company_reviews
  WHERE author_id = _user_id
    AND created_at >= now() - interval '24 hours';

  IF _recent_count >= _cap THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'rate_limited',
      'cap', _cap,
      'recent_count', _recent_count,
      'retry_after_hours', 24
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', _cap - _recent_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION can_submit_review() TO authenticated;

-- ------------------------------------------------------------
-- 3. Server-side enforcement via RLS-style INSERT trigger
--    (belt-and-suspenders — client check above is UX only)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_review_rate_limit()
RETURNS trigger AS $$
DECLARE
  _recent_count int;
  _cap constant int := 3;
BEGIN
  IF NEW.author_id = auth.uid() THEN
    SELECT COUNT(*) INTO _recent_count
    FROM company_reviews
    WHERE author_id = NEW.author_id
      AND created_at >= now() - interval '24 hours';
    IF _recent_count >= _cap THEN
      RAISE EXCEPTION 'Review rate limit: you can submit up to % reviews per 24 hours', _cap
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_rate_limit ON company_reviews;
CREATE TRIGGER trg_review_rate_limit
  BEFORE INSERT ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION enforce_review_rate_limit();
