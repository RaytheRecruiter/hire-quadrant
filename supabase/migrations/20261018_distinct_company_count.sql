-- N15: Home.tsx's "companies hiring" stat used
-- `.select('company', { count: 'exact', head: true })`, which counts rows
-- (jobs) with a non-null company, not distinct companies -- confirmed live
-- as the reason "companies hiring" rendered identical to "open jobs"
-- (e.g. 2,853 / 2,853). PostgREST's count mechanism can't express
-- COUNT(DISTINCT ...) through the query builder, so this needs a function.

CREATE OR REPLACE FUNCTION count_distinct_hiring_companies(it_only boolean DEFAULT true)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT company)::int
  FROM jobs
  WHERE company IS NOT NULL
    AND status != 'closed'
    AND (NOT it_only OR is_it_role = true);
$$;

GRANT EXECUTE ON FUNCTION count_distinct_hiring_companies(boolean) TO anon, authenticated;
