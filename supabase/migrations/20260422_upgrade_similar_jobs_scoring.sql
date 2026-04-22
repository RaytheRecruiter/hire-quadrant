-- ============================================================================
-- Upgrade similar jobs scoring algorithm
-- ============================================================================
-- Replaces the weak function (+3/+2/+1 scoring) with Ray's algorithm:
-- - Title word overlap (4+ char shared words): +10 per word, max +40
-- - Same job type (Full-time, Contract, etc.): +25
-- - Same location: +20
-- - Salary range overlap: +10
-- - Posted within last 7 days: +15

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
  src_type text;
  src_location text;
  src_min_salary int;
  src_max_salary int;
BEGIN
  -- Extract source job fields
  SELECT j.title, j.type, j.location, j.min_salary, j.max_salary
  INTO src_title, src_type, src_location, src_min_salary, src_max_salary
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
      -- Same job type: +25
      + CASE WHEN j.type = src_type THEN 25 ELSE 0 END
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
      -- Posted within last 7 days: +15
      + CASE WHEN j.posted_date > now() - interval '7 days' THEN 15 ELSE 0 END
    )::int AS similarity_score
  FROM jobs j
  WHERE j.id != source_job_id
  ORDER BY similarity_score DESC, j.posted_date DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Add RLS policies to job_views table for user data access
-- ============================================================================

-- Allow authenticated users to insert their own view records
CREATE POLICY IF NOT EXISTS "Users can insert own job views"
  ON job_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own view history
CREATE POLICY IF NOT EXISTS "Users can read own job views"
  ON job_views FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
