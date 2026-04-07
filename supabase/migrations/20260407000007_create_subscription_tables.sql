CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  job_limit integer NOT NULL DEFAULT 5,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  price_yearly numeric(10,2) NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','canceled','trialing','inactive')),
  job_limit integer NOT NULL DEFAULT 5,
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id)
);

INSERT INTO subscription_plans (name, slug, job_limit, price_monthly, price_yearly, features, sort_order) VALUES
  ('Free', 'free', 3, 0, 0, '["3 job postings","Basic analytics","Email support"]', 0),
  ('Basic', 'basic', 10, 29.99, 299.99, '["10 job postings","Advanced analytics","Priority support","Resume downloads"]', 1),
  ('Premium', 'premium', 50, 79.99, 799.99, '["50 job postings","Full analytics","Dedicated support","Resume downloads","Featured listings"]', 2),
  ('Enterprise', 'enterprise', -1, 199.99, 1999.99, '["Unlimited job postings","Custom analytics","Account manager","API access","White-label options"]', 3);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON subscription_plans FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Company can read own subscription" ON subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles up WHERE up.user_id = auth.uid() AND up.company_id = subscriptions.company_id));
CREATE POLICY "Admins can manage subscriptions" ON subscriptions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'admin'));
