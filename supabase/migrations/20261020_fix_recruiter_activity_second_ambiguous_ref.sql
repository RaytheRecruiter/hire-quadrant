-- Follow-up to 20261020_fix_recruiter_activity_ambiguous_user_id.sql --
-- retested live after that migration ran and the exact same error still
-- occurred:
--   {"code":"42702","message":"column reference \"user_id\" is ambiguous"}
--
-- The first fix only qualified the two CTE references. Missed a third,
-- in the authorization check at the top of the function:
--   EXISTS (SELECT 1 FROM company_members
--           WHERE company_id = p_company_id AND user_id = auth.uid() ...)
-- `user_id` there is unqualified against company_members, same conflict
-- with the function's own user_id OUT parameter.

CREATE OR REPLACE FUNCTION public.recruiter_activity(p_company_id uuid, p_since timestamp with time zone)
 RETURNS TABLE(user_id uuid, jobs_posted bigint, applicants_reviewed bigint, messages_sent bigint, last_active timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1 FROM company_members cm1
      WHERE cm1.company_id = p_company_id AND cm1.user_id = auth.uid() AND cm1.status = 'active'
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
    SELECT cm.user_id
    FROM company_members cm
    WHERE cm.company_id = p_company_id AND cm.status = 'active'
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
    WHERE sender_id IN (SELECT members.user_id FROM members)
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
$function$;
