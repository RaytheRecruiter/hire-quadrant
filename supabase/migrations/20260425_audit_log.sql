-- Audit log — append-only record of sensitive moderation / claim actions.
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action, created_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins read audit log"
  ON audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- No INSERT/UPDATE/DELETE policies — append-only via SECURITY DEFINER triggers.

-- Review moderation (approve/reject flips)
CREATE OR REPLACE FUNCTION fn_log_review_moderation()
RETURNS trigger AS $$
DECLARE
  _email text;
  _role text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT au.email, up.role INTO _email, _role
  FROM auth.users au LEFT JOIN user_profiles up ON up.id = au.id
  WHERE au.id = auth.uid();
  INSERT INTO audit_log (actor_id, actor_email, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(), _email, _role,
    'review.moderate',
    'company_review', NEW.id::text,
    jsonb_build_object(
      'from_status', OLD.status,
      'to_status', NEW.status,
      'rejected_reason', NEW.rejected_reason,
      'title', NEW.title
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_review_moderation ON company_reviews;
CREATE TRIGGER trg_audit_review_moderation
  AFTER UPDATE ON company_reviews
  FOR EACH ROW EXECUTE FUNCTION fn_log_review_moderation();

-- Company claim audit
CREATE OR REPLACE FUNCTION fn_log_company_claim()
RETURNS trigger AS $$
DECLARE _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
  INSERT INTO audit_log (actor_id, actor_email, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.user_id, _email,
    'company.claim.' || NEW.status,
    'company', NEW.company_id::text,
    jsonb_build_object('email_used', NEW.email_used, 'status', NEW.status)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_company_claim ON company_claims;
CREATE TRIGGER trg_audit_company_claim
  AFTER INSERT ON company_claims
  FOR EACH ROW EXECUTE FUNCTION fn_log_company_claim();

-- Report decision audit
CREATE OR REPLACE FUNCTION fn_log_report_decision()
RETURNS trigger AS $$
DECLARE _email text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  INSERT INTO audit_log (actor_id, actor_email, action, entity_type, entity_id, metadata)
  VALUES (
    auth.uid(), _email,
    'review_report.' || NEW.status,
    'company_review_report', NEW.id::text,
    jsonb_build_object('reason', NEW.reason, 'review_id', NEW.review_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_report_decision ON company_review_reports;
CREATE TRIGGER trg_audit_report_decision
  AFTER UPDATE ON company_review_reports
  FOR EACH ROW EXECUTE FUNCTION fn_log_report_decision();
