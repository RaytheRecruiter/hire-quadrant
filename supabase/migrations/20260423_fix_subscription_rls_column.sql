-- Fix subscription RLS policies to use user_profiles.id (not user_id)
--
-- Migration 20260407000007 created RLS policies that reference
-- `user_profiles.user_id`, but user_profiles has no user_id column — the
-- auth-user FK column is `id`. A follow-up migration fixed user_profiles'
-- own policies (20260423_fix_rls_policies_user_profiles.sql) but missed
-- subscription_plans and subscriptions. As-is, "admin" and "company read
-- own subscription" checks silently match zero rows, so legitimate
-- access fails. Corrects the three affected policies below.

DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
CREATE POLICY "Admins can manage plans" ON subscription_plans
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "Company can read own subscription" ON subscriptions;
CREATE POLICY "Company can read own subscription" ON subscriptions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles up
    WHERE up.id = auth.uid() AND up.company_id = subscriptions.company_id
  ));

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON subscriptions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));
