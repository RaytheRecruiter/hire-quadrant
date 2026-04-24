-- ============================================================
-- Phase 5: Company Pages (Indeed-style directory + reviews)
--
-- Extends the existing `companies` table (created by employer
-- signup flow) with the fields needed for a public directory,
-- claim flow, and review system. Also introduces join tables
-- for multi-admin support, reviews, responses, followers, page
-- views, and a claims audit trail.
--
-- Idempotent: safe to re-run. Uses IF NOT EXISTS throughout.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Extend `companies` table
-- ------------------------------------------------------------
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email_domain text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS header_image_url text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS socials jsonb DEFAULT '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS view_count_30d int DEFAULT 0;

-- Backfill slug for existing rows (case-insensitive, hyphenated)
UPDATE companies
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Strip leading/trailing hyphens from generated slugs
UPDATE companies
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- Handle duplicate slugs (append row number suffix)
WITH dupes AS (
  SELECT id, slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM companies
  WHERE slug IS NOT NULL
)
UPDATE companies c
SET slug = c.slug || '-' || d.rn
FROM dupes d
WHERE c.id = d.id AND d.rn > 1;

-- Now lock slug uniqueness + not null
ALTER TABLE companies ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_key ON companies(slug);

-- Backfill email_domain from contact_email for existing claimed rows
UPDATE companies
SET email_domain = SPLIT_PART(contact_email, '@', 2)
WHERE email_domain IS NULL
  AND contact_email IS NOT NULL
  AND contact_email LIKE '%@%';

-- ------------------------------------------------------------
-- 2. Link jobs.company (text) -> companies.id (uuid)
-- ------------------------------------------------------------
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);

-- ------------------------------------------------------------
-- 3. Backfill companies from DISTINCT jobs.company (scraped
--    employer names that aren't already in the companies table)
-- ------------------------------------------------------------
INSERT INTO companies (name, display_name, slug, is_active)
SELECT
  TRIM(j.company) AS name,
  TRIM(j.company) AS display_name,
  LOWER(REGEXP_REPLACE(TRIM(j.company), '[^a-zA-Z0-9]+', '-', 'g')) AS slug,
  true
FROM (
  SELECT DISTINCT company
  FROM jobs
  WHERE company IS NOT NULL
    AND TRIM(company) <> ''
) j
WHERE NOT EXISTS (
  SELECT 1 FROM companies c
  WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(j.company))
)
ON CONFLICT (slug) DO NOTHING;

-- Link jobs.company_id to the backfilled company rows
UPDATE jobs j
SET company_id = c.id
FROM companies c
WHERE j.company_id IS NULL
  AND LOWER(TRIM(j.company)) = LOWER(TRIM(c.name));

-- ------------------------------------------------------------
-- 4. New table: company_admins (multi-admin join)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_admins (
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_admins_user ON company_admins(user_id);

-- Backfill: for every existing user_profile with a company_id (the
-- legacy single-admin model), promote them to company_admins.owner
INSERT INTO company_admins (company_id, user_id, role)
SELECT up.company_id, up.id, 'owner'
FROM user_profiles up
WHERE up.company_id IS NOT NULL
  AND up.role IN ('company', 'admin')
ON CONFLICT DO NOTHING;

ALTER TABLE company_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read company_admins"
  ON company_admins FOR SELECT USING (true);

CREATE POLICY "Super admins manage company_admins"
  ON company_admins FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ------------------------------------------------------------
-- 5. New table: company_reviews
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating_overall smallint NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_work_life smallint CHECK (rating_work_life BETWEEN 1 AND 5),
  rating_compensation smallint CHECK (rating_compensation BETWEEN 1 AND 5),
  rating_management smallint CHECK (rating_management BETWEEN 1 AND 5),
  rating_culture smallint CHECK (rating_culture BETWEEN 1 AND 5),
  rating_career_growth smallint CHECK (rating_career_growth BETWEEN 1 AND 5),
  title text NOT NULL,
  pros text,
  cons text,
  employment_status text CHECK (employment_status IN ('current', 'former')),
  job_title text,
  is_anonymous boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejected_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_company ON company_reviews(company_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_author ON company_reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON company_reviews(status) WHERE status = 'pending';

ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads approved reviews"
  ON company_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Authors read their own reviews"
  ON company_reviews FOR SELECT TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Company admins read their company reviews"
  ON company_reviews FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_admins.company_id = company_reviews.company_id
      AND company_admins.user_id = auth.uid()
  ));

CREATE POLICY "Super admins read all reviews"
  ON company_reviews FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users insert their own review"
  ON company_reviews FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND status = 'pending');

CREATE POLICY "Authors update their own review"
  ON company_reviews FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid() AND status = 'pending');

CREATE POLICY "Super admins moderate reviews"
  ON company_reviews FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authors delete their own review"
  ON company_reviews FOR DELETE TO authenticated
  USING (author_id = auth.uid());

-- Keep updated_at fresh, and reset status to pending when content changes
CREATE OR REPLACE FUNCTION touch_company_review()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  -- If the author edited content (not a moderation flip), reset to pending
  IF NEW.author_id = OLD.author_id
     AND (NEW.title IS DISTINCT FROM OLD.title
          OR NEW.pros IS DISTINCT FROM OLD.pros
          OR NEW.cons IS DISTINCT FROM OLD.cons
          OR NEW.rating_overall IS DISTINCT FROM OLD.rating_overall)
     AND NEW.status = OLD.status THEN
    NEW.status = 'pending';
    NEW.rejected_reason = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_company_review ON company_reviews;
CREATE TRIGGER trg_touch_company_review
  BEFORE UPDATE ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION touch_company_review();

-- ------------------------------------------------------------
-- 6. New table: company_review_responses (1:1 with review)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_review_responses (
  review_id uuid PRIMARY KEY REFERENCES company_reviews(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  responder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responses_company ON company_review_responses(company_id);

ALTER TABLE company_review_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads responses to approved reviews"
  ON company_review_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM company_reviews
    WHERE company_reviews.id = company_review_responses.review_id
      AND company_reviews.status = 'approved'
  ));

CREATE POLICY "Company admins manage responses for their company"
  ON company_review_responses FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_admins.company_id = company_review_responses.company_id
      AND company_admins.user_id = auth.uid()
  ))
  WITH CHECK (
    responder_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM company_admins
      WHERE company_admins.company_id = company_review_responses.company_id
        AND company_admins.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 7. New table: company_followers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_followers (
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_user ON company_followers(user_id);

ALTER TABLE company_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads follower counts"
  ON company_followers FOR SELECT USING (true);

CREATE POLICY "Users manage their own follows"
  ON company_followers FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ------------------------------------------------------------
-- 8. New table: company_page_views (analytics)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_page_views (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_company_time
  ON company_page_views(company_id, viewed_at DESC);

ALTER TABLE company_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone inserts page views"
  ON company_page_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Company admins read their page views"
  ON company_page_views FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_admins.company_id = company_page_views.company_id
      AND company_admins.user_id = auth.uid()
  ));

CREATE POLICY "Super admins read all page views"
  ON company_page_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ------------------------------------------------------------
-- 9. New table: company_claims (audit trail)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_used text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_at timestamptz,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claims_company ON company_claims(company_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON company_claims(status) WHERE status = 'pending';

ALTER TABLE company_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own claims"
  ON company_claims FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Super admins read all claims"
  ON company_claims FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Super admins update claims"
  ON company_claims FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ------------------------------------------------------------
-- 10. RPC: claim_company
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION claim_company(target_slug text)
RETURNS jsonb AS $$
DECLARE
  _user_id uuid := auth.uid();
  _user_email text;
  _user_domain text;
  _company record;
  _already_admin boolean;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  _user_domain := LOWER(SPLIT_PART(_user_email, '@', 2));

  SELECT id, name, slug, email_domain, claimed_at INTO _company
  FROM companies WHERE slug = target_slug;

  IF _company.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'company_not_found');
  END IF;

  IF _company.email_domain IS NULL THEN
    -- Allow claim on any unclaimed company if no email_domain is set yet,
    -- and record the claiming user's domain as the email_domain going forward
    UPDATE companies SET email_domain = _user_domain WHERE id = _company.id;
    _company.email_domain := _user_domain;
  END IF;

  IF LOWER(_company.email_domain) <> _user_domain THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'email_domain_mismatch',
      'required_domain', _company.email_domain
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_id = _company.id AND user_id = _user_id
  ) INTO _already_admin;

  IF NOT _already_admin THEN
    INSERT INTO company_admins (company_id, user_id, role)
    VALUES (_company.id, _user_id, 'owner');
  END IF;

  INSERT INTO company_claims (company_id, user_id, email_used, status, decided_at, decided_by)
  VALUES (_company.id, _user_id, _user_email, 'approved', now(), _user_id);

  UPDATE companies
  SET claimed_at = COALESCE(claimed_at, now())
  WHERE id = _company.id;

  UPDATE user_profiles
  SET role = 'company',
      company_id = _company.id
  WHERE id = _user_id
    AND role NOT IN ('admin');

  RETURN jsonb_build_object('success', true, 'company_id', _company.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION claim_company(text) TO authenticated;

-- ------------------------------------------------------------
-- 11. RPC: get_company_dashboard_stats
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_company_dashboard_stats(target_company_id uuid)
RETURNS jsonb AS $$
DECLARE
  _views_30d int;
  _review_count int;
  _avg_rating numeric;
  _follower_count int;
BEGIN
  -- Restrict to admins of this company or super admins
  IF NOT (
    EXISTS (SELECT 1 FROM company_admins WHERE company_id = target_company_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  SELECT COUNT(*) INTO _views_30d
  FROM company_page_views
  WHERE company_id = target_company_id
    AND viewed_at >= now() - interval '30 days';

  SELECT COUNT(*), AVG(rating_overall)::numeric(3,2)
  INTO _review_count, _avg_rating
  FROM company_reviews
  WHERE company_id = target_company_id AND status = 'approved';

  SELECT COUNT(*) INTO _follower_count
  FROM company_followers
  WHERE company_id = target_company_id;

  RETURN jsonb_build_object(
    'total_views_30d', _views_30d,
    'review_count', _review_count,
    'avg_rating', COALESCE(_avg_rating, 0),
    'follower_count', _follower_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_company_dashboard_stats(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 12. RPC: record_company_view (called from public profile page)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION record_company_view(target_company_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO company_page_views (company_id, viewer_id)
  VALUES (target_company_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION record_company_view(uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 13. Directory query helper: public companies with stats
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public_company_directory AS
SELECT
  c.id,
  c.slug,
  c.name,
  c.display_name,
  c.logo,
  c.industry,
  c.size,
  c.location,
  c.description,
  c.claimed_at,
  COALESCE(j.job_count, 0) AS job_count,
  COALESCE(r.review_count, 0) AS review_count,
  COALESCE(r.avg_rating, 0)::numeric(3,2) AS avg_rating
FROM companies c
LEFT JOIN (
  SELECT company_id, COUNT(*) AS job_count
  FROM jobs
  WHERE company_id IS NOT NULL
  GROUP BY company_id
) j ON j.company_id = c.id
LEFT JOIN (
  SELECT company_id, COUNT(*) AS review_count, AVG(rating_overall) AS avg_rating
  FROM company_reviews
  WHERE status = 'approved'
  GROUP BY company_id
) r ON r.company_id = c.id
WHERE c.is_active = true
  AND (COALESCE(j.job_count, 0) > 0 OR COALESCE(r.review_count, 0) > 0);

GRANT SELECT ON public_company_directory TO anon, authenticated;
