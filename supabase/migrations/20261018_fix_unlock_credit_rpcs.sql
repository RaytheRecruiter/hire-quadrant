-- CRITICAL, found continuing N19 QA (2026-10-18): two more bugs in the
-- Billing tab's unlock-credit RPCs.
--
-- 1. unlocks_remaining(p_company_id uuid) is SECURITY DEFINER (bypasses
--    RLS) and GRANT EXECUTE ... TO authenticated, but never checks the
--    caller actually belongs to p_company_id -- the same gap already
--    fixed today on recruiter_activity and employer_benchmarks. Any
--    authenticated account can call it with an arbitrary company_id and
--    read that company's subscription credit allowance/usage.
--
-- 2. unlock_candidate(p_candidate_user_id uuid) resolves the caller's own
--    company correctly (via auth.uid(), never a client-supplied id -- this
--    part was already safe), but only looks in company_members. Every
--    company claimed via claim_company (ClaimBanner.tsx) after the
--    one-time company_members Owner backfill ran (2026-04-29,
--    20260429_company_permissions_phase1.sql) gets a user_profiles.
--    company_id link but no company_members row, since claim_company was
--    never updated to also insert one. Net effect: any company claimed in
--    the last ~6 months cannot unlock a single candidate resume -- it
--    always hits "You are not linked to a company account." Added the
--    same legacy user_profiles.company_id fallback used everywhere else
--    today.
--
-- NOTE: this corrects an earlier attempt at this same fix today that used
-- the stale pre-2026-08-14 4-column shape of unlocks_remaining (no
-- purchased_remaining) and dropped unlock_candidate's purchased-credit
-- fallback logic entirely -- that attempt failed outright on
-- "cannot change return type of existing function" and was never applied
-- (Supabase's SQL editor runs a script as one transaction, so nothing
-- from it landed). This version is built against the real current
-- definitions in 20260814_resume_database_pricing.sql.

CREATE OR REPLACE FUNCTION unlocks_remaining(p_company_id uuid)
RETURNS TABLE (
  total integer,
  used integer,
  remaining integer,
  purchased_remaining integer,
  period_start timestamptz
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
  WITH sub AS (
    SELECT s.current_period_start, s.purchased_contacts_remaining, sp.monthly_unlock_credits
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.plan_id
    WHERE s.company_id = p_company_id
      AND s.status IN ('active', 'trialing')
    ORDER BY s.updated_at DESC
    LIMIT 1
  ),
  resolved AS (
    SELECT
      COALESCE((SELECT monthly_unlock_credits FROM sub), 0) AS total,
      COALESCE((SELECT purchased_contacts_remaining FROM sub), 0) AS purchased_remaining,
      COALESCE(
        (SELECT current_period_start FROM sub),
        date_trunc('month', now())
      ) AS period_start
  ),
  used_cte AS (
    SELECT count(*)::int AS n
    FROM candidate_unlocks cu, resolved
    WHERE cu.company_id = p_company_id
      AND cu.period_start >= resolved.period_start
      AND cu.credit_source = 'monthly'
  )
  SELECT
    resolved.total,
    used_cte.n AS used,
    greatest(resolved.total - used_cte.n, 0) AS remaining,
    resolved.purchased_remaining,
    resolved.period_start
  FROM resolved, used_cte;
END;
$$;

CREATE OR REPLACE FUNCTION unlock_candidate(p_candidate_user_id uuid)
RETURNS TABLE (
  unlock_id uuid,
  remaining integer,
  already_unlocked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_period_start timestamptz;
  v_allowance integer;
  v_purchased_remaining integer;
  v_used integer;
  v_unlock_id uuid;
  v_existing uuid;
  v_source text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be signed in';
  END IF;

  SELECT cm.company_id INTO v_company_id
  FROM company_members cm
  WHERE cm.user_id = v_user_id AND cm.status = 'active'
  LIMIT 1;

  IF v_company_id IS NULL THEN
    SELECT up.company_id INTO v_company_id
    FROM user_profiles up
    WHERE up.id = v_user_id AND up.role = 'company' AND up.company_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id);
  END IF;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'You are not linked to a company account';
  END IF;

  SELECT sp.monthly_unlock_credits,
         s.purchased_contacts_remaining,
         COALESCE(s.current_period_start, date_trunc('month', now()))
    INTO v_allowance, v_purchased_remaining, v_period_start
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.company_id = v_company_id
    AND s.status IN ('active', 'trialing')
  ORDER BY s.updated_at DESC
  LIMIT 1;

  IF v_allowance IS NULL THEN
    RAISE EXCEPTION 'No active subscription with unlock credits';
  END IF;

  SELECT cu.id INTO v_existing
  FROM candidate_unlocks cu
  WHERE cu.company_id = v_company_id
    AND cu.candidate_user_id = p_candidate_user_id
    AND cu.period_start >= v_period_start
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    SELECT count(*) INTO v_used
    FROM candidate_unlocks
    WHERE company_id = v_company_id AND period_start >= v_period_start AND credit_source = 'monthly';
    RETURN QUERY SELECT v_existing, greatest(v_allowance - v_used, 0)::int, true;
    RETURN;
  END IF;

  SELECT count(*) INTO v_used
  FROM candidate_unlocks
  WHERE company_id = v_company_id AND period_start >= v_period_start AND credit_source = 'monthly';

  IF v_used < v_allowance THEN
    v_source := 'monthly';
  ELSIF COALESCE(v_purchased_remaining, 0) > 0 THEN
    v_source := 'purchased';
    UPDATE subscriptions
    SET purchased_contacts_remaining = purchased_contacts_remaining - 1
    WHERE company_id = v_company_id;
  ELSE
    RAISE EXCEPTION 'No unlock credits remaining this billing period';
  END IF;

  INSERT INTO candidate_unlocks (company_id, candidate_user_id, unlocked_by, period_start, credit_source)
  VALUES (v_company_id, p_candidate_user_id, v_user_id, v_period_start, v_source)
  RETURNING id INTO v_unlock_id;

  RETURN QUERY SELECT
    v_unlock_id,
    CASE WHEN v_source = 'monthly' THEN greatest(v_allowance - (v_used + 1), 0)::int ELSE greatest(v_allowance - v_used, 0)::int END,
    false;
END;
$$;
