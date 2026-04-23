-- Add a real `category` column to jobs so the "Same category → +25" bucket
-- in find_similar_jobs matches the marketing copy (Engineering, Design,
-- Marketing, Finance, Sales, Operations, Data & Analytics, Healthcare,
-- Other). Backfills existing rows from title keywords.
--
-- Run this in the Supabase SQL editor before deploying PR #13.

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category text;
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);

-- One-shot backfill. Regex uses \m \M word boundaries so "engineered"
-- doesn't match "engineer" (it does, actually — but close enough for a
-- rules-based first pass).
UPDATE jobs SET category = CASE
  WHEN lower(title) ~ '\m(engineer|developer|devops|programmer|software|swe|sre|full[- ]stack|back[- ]end|front[- ]end)\M' THEN 'Engineering'
  WHEN lower(title) ~ '\m(designer|ux|ui|product design|graphic design|creative)\M' THEN 'Design'
  WHEN lower(title) ~ '\m(marketing|seo|content|brand|growth|social media)\M' THEN 'Marketing'
  WHEN lower(title) ~ '\m(finance|accountant|accounting|auditor|controller)\M' THEN 'Finance'
  WHEN lower(title) ~ '\m(sales|account executive|bdr|sdr|account manager)\M' THEN 'Sales'
  WHEN lower(title) ~ '\m(operations|logistics|supply chain|coordinator)\M' THEN 'Operations'
  WHEN lower(title) ~ '\m(data|analytics|ml|bi)\M' THEN 'Data & Analytics'
  WHEN lower(title) ~ '\m(nurse|doctor|medical|clinical|healthcare|rn|cna|therapist)\M' THEN 'Healthcare'
  ELSE 'Other'
END
WHERE category IS NULL;

-- Replace the find_similar_jobs scoring function to use category instead
-- of type for the +25 bucket. Keeps every other weight identical.
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
DECLARE
  src_title text;
  src_category text;
  src_location text;
  src_min_salary int;
  src_max_salary int;
BEGIN
  SELECT j.title, j.category, j.location, j.min_salary, j.max_salary
  INTO src_title, src_category, src_location, src_min_salary, src_max_salary
  FROM jobs j
  WHERE j.id = source_job_id;

  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.company,
    j.location,
    j.type,
    j.salary,
    j.posted_date,
    (
      -- Title word overlap: +10 per matching 4+ char word, max +40
      (
        SELECT LEAST(COUNT(*)::int * 10, 40)
        FROM unnest(string_to_array(lower(regexp_replace(j.title, '[^a-z0-9 ]', '', 'g')), ' ')) w
        WHERE length(w) > 3
          AND w = ANY(string_to_array(lower(regexp_replace(src_title, '[^a-z0-9 ]', '', 'g')), ' '))
      )
      -- Same category: +25
      + CASE WHEN j.category = src_category AND src_category IS NOT NULL THEN 25 ELSE 0 END
      -- Same location: +20
      + CASE WHEN j.location = src_location THEN 20 ELSE 0 END
      -- Salary range overlap: +10
      + CASE
        WHEN src_min_salary IS NOT NULL
          AND j.max_salary IS NOT NULL
          AND j.max_salary >= src_min_salary
          AND j.min_salary IS NOT NULL
          AND j.min_salary <= COALESCE(src_max_salary, src_min_salary * 2)
        THEN 10
        ELSE 0
      END
      -- Freshness: +15 if posted within last 7 days
      + CASE WHEN j.posted_date > now() - interval '7 days' THEN 15 ELSE 0 END
    )::int AS similarity_score
  FROM jobs j
  WHERE j.id != source_job_id
  ORDER BY similarity_score DESC, j.posted_date DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
