-- N15: public_company_directory.job_count (20260425_trust_bundle.sql) counts
-- every job row for a company with no status or IT-eligibility filter, while
-- CompanyProfile's "Open Positions (N)" list (useCompanyJobs.ts) shows only
-- status = 'open' AND is_it_role = true jobs. The two numbers on the same
-- page (header "Open roles" stat vs. the section heading count) can
-- therefore disagree -- worse now than before 20261018_it_job_eligibility.sql,
-- since the list got narrower but this view's count didn't. Align the view's
-- subquery to the exact same filter the list actually uses.

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
  WHERE company_id IS NOT NULL AND status = 'open' AND is_it_role = true
  GROUP BY company_id
) j ON j.company_id = c.id
LEFT JOIN (
  SELECT company_id, COUNT(*) AS review_count, AVG(rating_overall) AS avg_rating
  FROM company_reviews WHERE status = 'approved' AND deleted_at IS NULL GROUP BY company_id
) r ON r.company_id = c.id
WHERE c.is_active = true
  AND (COALESCE(j.job_count, 0) > 0 OR COALESCE(r.review_count, 0) > 0);
