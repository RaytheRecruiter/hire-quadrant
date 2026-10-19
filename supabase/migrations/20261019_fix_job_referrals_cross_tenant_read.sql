-- Found auditing the referral system (2026-10-19): job_referrals'
-- SELECT policy let any company-role user read every referral record
-- platform-wide (referrer identity, referee_email, reward_amount_cents,
-- status) with no check that the referral's job belongs to their
-- company. Confirmed live via pg_policies. Scoped through
-- job_referrals.job_id -> jobs.company_id -> company_members, matching
-- the pattern already fixed for job_applications and
-- scheduled_interviews.

DROP POLICY IF EXISTS "job_referrals_self_read" ON job_referrals;

CREATE POLICY "job_referrals_self_read"
  ON job_referrals FOR SELECT TO authenticated
  USING (
    referrer_id = auth.uid()
    OR referee_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN company_members cm ON cm.company_id = j.company_id
      WHERE j.id = job_referrals.job_id
        AND cm.user_id = auth.uid()
        AND cm.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM jobs j
      JOIN user_profiles up ON up.company_id = j.company_id
      WHERE j.id = job_referrals.job_id
        AND up.id = auth.uid()
        AND up.role = 'company'
        AND NOT EXISTS (SELECT 1 FROM company_members cm2 WHERE cm2.user_id = up.id)
    )
  );
