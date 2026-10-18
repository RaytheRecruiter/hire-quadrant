-- CRITICAL, found continuing N19 QA (2026-10-18): three employer-dashboard
-- RPCs have authorization bugs of the same two flavors already fixed today
-- (a policy referencing a column/table the real write path never
-- populates, and a SECURITY DEFINER function with no internal auth check).
--
-- 1. get_company_dashboard_stats (powers the Analytics tab) checks
--    `company_admins`, a table created 2026-04-23
--    (20260423_phase5_company_pages.sql) that nothing in the codebase has
--    ever inserted a row into -- grepped src/, supabase/functions/, and
--    every migration, confirmed none. It predates company_members
--    (2026-04-29), which is what every real employer account actually has
--    a row in. Net effect: this RPC returns {"error": "forbidden"} for
--    every single company account (the role='admin' branch only matches
--    Nexegin's own internal platform admins, not employers) -- the
--    Analytics tab has never loaded real data for any employer, ever,
--    since the feature shipped.
--
-- 2. recruiter_activity and employer_benchmarks are both SECURITY DEFINER
--    (bypasses table RLS entirely) and GRANT EXECUTE ... TO authenticated,
--    but neither checks that the calling user actually belongs to the
--    p_company_id passed in. Any authenticated account -- including a
--    candidate, or an employer at a different company -- can call either
--    directly via supabase.rpc() with an arbitrary company_id and get back
--    another company's team member names/emails/activity counts
--    (recruiter_activity) or rating/job/application stats
--    (employer_benchmarks). employer_benchmarks' own migration comment
--    says access was only ever "enforced in app" -- it never was enforced
--    in SQL, confirmed by reading the function body.
--
-- Fixed all three with the same company_members/legacy-user_profiles
-- membership check already used by today's job_applications RLS fix
-- (20261018_fix_company_applications_rls.sql).

CREATE OR REPLACE FUNCTION get_company_dashboard_stats(target_company_id uuid)
RETURNS jsonb AS $$
DECLARE
  _views_30d int;
  _review_count int;
  _avg_rating numeric;
  _follower_count int;
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = target_company_id AND user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = target_company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
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

CREATE OR REPLACE FUNCTION recruiter_activity(
  p_company_id uuid,
  p_since timestamptz
)
RETURNS TABLE (
  user_id uuid,
  jobs_posted bigint,
  applicants_reviewed bigint,
  messages_sent bigint,
  last_active timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = p_company_id AND user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = p_company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized for this company';
  END IF;

  RETURN QUERY
  WITH members AS (
    SELECT user_id
    FROM company_members
    WHERE company_id = p_company_id AND status = 'active'
  ),
  jobs_count AS (
    SELECT posted_by AS user_id, COUNT(*)::bigint AS n, MAX(created_at) AS last_at
    FROM jobs
    WHERE company_id = p_company_id
      AND posted_by IS NOT NULL
      AND created_at >= p_since
    GROUP BY posted_by
  ),
  reviews_count AS (
    SELECT ar.reviewer_id AS user_id,
           COUNT(DISTINCT ar.application_id)::bigint AS n,
           MAX(ar.reviewed_at) AS last_at
    FROM application_reviews ar
    JOIN job_applications ja ON ja.id = ar.application_id
    JOIN jobs j ON j.id = ja.job_id
    WHERE j.company_id = p_company_id
      AND ar.reviewed_at >= p_since
    GROUP BY ar.reviewer_id
  ),
  messages_count AS (
    SELECT sender_id AS user_id,
           COUNT(*)::bigint AS n,
           MAX(created_at) AS last_at
    FROM messages
    WHERE sender_id IN (SELECT user_id FROM members)
      AND created_at >= p_since
    GROUP BY sender_id
  )
  SELECT
    m.user_id,
    COALESCE(jc.n, 0) AS jobs_posted,
    COALESCE(rc.n, 0) AS applicants_reviewed,
    COALESCE(mc.n, 0) AS messages_sent,
    GREATEST(jc.last_at, rc.last_at, mc.last_at) AS last_active
  FROM members m
  LEFT JOIN jobs_count jc ON jc.user_id = m.user_id
  LEFT JOIN reviews_count rc ON rc.user_id = m.user_id
  LEFT JOIN messages_count mc ON mc.user_id = m.user_id;
END;
$$;

CREATE OR REPLACE FUNCTION employer_benchmarks(p_company_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  my_industry text;
  my_rating numeric;
  my_review_count int;
  my_job_count int;
  my_application_count int;
  peer_rating numeric;
  peer_review_count numeric;
  peer_job_count numeric;
  peer_application_count numeric;
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1 FROM company_members
      WHERE company_id = p_company_id AND user_id = auth.uid() AND status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.company_id = p_company_id AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized for this company';
  END IF;

  SELECT industry INTO my_industry FROM companies WHERE id = p_company_id;

  SELECT COALESCE(AVG(rating)::numeric(3,2), 0), COUNT(*)::int
    INTO my_rating, my_review_count
    FROM company_reviews
    WHERE company_id = p_company_id
      AND status = 'approved'
      AND deleted_at IS NULL;

  SELECT COUNT(*)::int INTO my_job_count
    FROM jobs WHERE company_id = p_company_id;

  SELECT COUNT(*)::int INTO my_application_count
    FROM job_applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE j.company_id = p_company_id;

  SELECT
    percentile_cont(0.5) WITHIN GROUP (ORDER BY r.avg_rating),
    percentile_cont(0.5) WITHIN GROUP (ORDER BY r.cnt),
    percentile_cont(0.5) WITHIN GROUP (ORDER BY j.cnt),
    percentile_cont(0.5) WITHIN GROUP (ORDER BY a.cnt)
    INTO peer_rating, peer_review_count, peer_job_count, peer_application_count
    FROM companies c
    LEFT JOIN (
      SELECT company_id, AVG(rating)::numeric(3,2) AS avg_rating, COUNT(*) AS cnt
        FROM company_reviews
        WHERE status = 'approved' AND deleted_at IS NULL
        GROUP BY company_id
    ) r ON r.company_id = c.id
    LEFT JOIN (
      SELECT company_id, COUNT(*) AS cnt FROM jobs GROUP BY company_id
    ) j ON j.company_id = c.id
    LEFT JOIN (
      SELECT j2.company_id, COUNT(*) AS cnt
        FROM job_applications a2
        JOIN jobs j2 ON j2.id = a2.job_id
        GROUP BY j2.company_id
    ) a ON a.company_id = c.id
    WHERE c.industry = my_industry
      AND c.id <> p_company_id;

  RETURN jsonb_build_object(
    'industry', my_industry,
    'my', jsonb_build_object(
      'rating', my_rating,
      'review_count', my_review_count,
      'job_count', my_job_count,
      'application_count', my_application_count
    ),
    'peer_median', jsonb_build_object(
      'rating', COALESCE(peer_rating, 0),
      'review_count', COALESCE(peer_review_count, 0),
      'job_count', COALESCE(peer_job_count, 0),
      'application_count', COALESCE(peer_application_count, 0)
    )
  );
END;
$$;
