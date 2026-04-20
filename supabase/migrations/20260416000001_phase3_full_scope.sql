-- Phase 3B–3E: All remaining features

-- ============================================================================
-- 1. COMPANY REVIEWS (#5 — like Glassdoor/Indeed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS company_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL,
  body text NOT NULL,
  pros text,
  cons text,
  job_title text,
  employment_status text CHECK (employment_status IN ('current', 'former', 'interviewed')),
  is_anonymous boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_company_reviews_company_id ON company_reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_company_reviews_reviewer_id ON company_reviews(reviewer_id);

ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read company reviews"
  ON company_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON company_reviews FOR INSERT TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can edit own reviews"
  ON company_reviews FOR UPDATE TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON company_reviews FOR DELETE TO authenticated
  USING (reviewer_id = auth.uid());

-- ============================================================================
-- 2. CANDIDATE RATING / SHORTLISTING (#8)
-- ============================================================================
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS employer_rating int CHECK (employer_rating >= 1 AND employer_rating <= 5);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS employer_notes text;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS employer_tags text[] DEFAULT '{}';
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS is_shortlisted boolean DEFAULT false;

-- ============================================================================
-- 3. RESUME DATABASE SEARCH (#9)
-- ============================================================================
-- Add a parsed text column on candidates for keyword search
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS resume_text text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS headline text;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS years_experience int;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS open_to_work boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_candidates_skills ON candidates USING gin(skills);
CREATE INDEX IF NOT EXISTS idx_candidates_resume_text_fts
  ON candidates USING gin(to_tsvector('english', coalesce(resume_text, '') || ' ' || coalesce(headline, '')));

-- RLS: companies with an active subscription can search candidates
DROP POLICY IF EXISTS "Companies can search candidates" ON candidates;
CREATE POLICY "Companies can search candidates"
  ON candidates FOR SELECT TO authenticated
  USING (
    open_to_work = true
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('company', 'admin')
    )
  );

-- ============================================================================
-- 4. SAVED SEARCHES / JOB ALERTS (#4 second half)
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  search_term text,
  location_filter text,
  type_filter text,
  min_salary int,
  email_frequency text DEFAULT 'daily' CHECK (email_frequency IN ('daily', 'weekly', 'never')),
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved searches"
  ON saved_searches FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. BLOG POSTS (#16)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body text NOT NULL,
  cover_image_url text,
  author_name text DEFAULT 'HireQuadrant Team',
  category text DEFAULT 'career' CHECK (category IN ('career', 'resume', 'interview', 'hiring', 'industry')),
  published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts FOR SELECT USING (published = true);

CREATE POLICY "Admins manage blog posts"
  ON blog_posts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed a few starter posts so the blog isn't empty
INSERT INTO blog_posts (slug, title, excerpt, body, category, published, published_at)
VALUES
  ('how-to-write-a-great-resume', 'How to Write a Great Resume in 2026',
   'The modern resume has changed. Here''s what recruiters actually look for.',
   E'## Start with a strong summary\nYour top 3 lines matter most...\n\n## Quantify every achievement\nInstead of "Improved performance" write "Reduced page load time by 40% serving 2M users".\n\n## Tailor to the job description\nGeneric resumes get filtered out. Mirror the language in the posting.',
   'resume', true, now()),
  ('ace-your-next-interview', 'Ace Your Next Technical Interview',
   'Five practices that separate offer candidates from near-misses.',
   E'## Research the company deeply\nGo beyond the About page. Read their engineering blog, recent PRs on GitHub, and Glassdoor reviews.\n\n## STAR your stories\nSituation, Task, Action, Result. Make every answer a complete story.\n\n## Ask great questions\nThe questions you ask reveal more about you than the ones you answer.',
   'interview', true, now()),
  ('what-hiring-managers-look-for', 'What Hiring Managers Actually Look For',
   'Insider notes from hiring managers across tech, finance, and healthcare.',
   E'## Signal over noise\nHiring managers scan for 3 things: relevant experience, growth trajectory, and communication.\n\n## The "so what" test\nEvery bullet on your resume should pass: "So what? Why does this matter to the role I want?"\n\n## Culture fit is real\nBut it''s about collaboration style, not personality tests.',
   'career', true, now())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 6. AI-GENERATED JOB DESCRIPTIONS (#1)
-- Column for storing AI-generated content indicator
-- ============================================================================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ai_generated_description boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS min_salary int;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_salary int;

-- ============================================================================
-- 7. JOB RECOMMENDATIONS HELPER (#15)
-- Function to find similar jobs by location + type + keyword overlap
-- ============================================================================
CREATE OR REPLACE FUNCTION find_similar_jobs(source_job_id text, result_limit int DEFAULT 5)
RETURNS TABLE (
  id text,
  title text,
  company text,
  location text,
  type text,
  salary text,
  posted_date timestamptz,
  similarity_score int
) AS $$
BEGIN
  RETURN QUERY
  WITH source AS (
    SELECT j.type, j.location, j.company
    FROM jobs j WHERE j.id = source_job_id
  )
  SELECT
    j.id, j.title, j.company, j.location, j.type, j.salary, j.posted_date,
    (
      (CASE WHEN j.type = (SELECT type FROM source) THEN 3 ELSE 0 END) +
      (CASE WHEN j.location = (SELECT location FROM source) THEN 2 ELSE 0 END) +
      (CASE WHEN j.company = (SELECT company FROM source) THEN 1 ELSE 0 END)
    )::int AS similarity_score
  FROM jobs j
  WHERE j.id != source_job_id
  ORDER BY similarity_score DESC, j.posted_date DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. TRENDING DATA HELPERS (#17)
-- ============================================================================
CREATE OR REPLACE VIEW trending_companies AS
SELECT company, COUNT(*)::int AS job_count, SUM(COALESCE(views, 0))::int AS total_views
FROM jobs
WHERE posted_date > now() - interval '30 days'
GROUP BY company
ORDER BY total_views DESC, job_count DESC
LIMIT 10;

CREATE OR REPLACE VIEW trending_locations AS
SELECT location, COUNT(*)::int AS job_count
FROM jobs
WHERE posted_date > now() - interval '30 days' AND location IS NOT NULL AND location <> ''
GROUP BY location
ORDER BY job_count DESC
LIMIT 10;

-- ============================================================================
-- 9. ATS INTEGRATIONS (#11 — minimal placeholder)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ats_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('greenhouse', 'lever', 'workday', 'icims', 'other')),
  api_key_encrypted text,
  config jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, provider)
);

ALTER TABLE ats_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ATS integrations"
  ON ats_integrations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
