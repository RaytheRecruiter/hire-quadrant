-- CRITICAL, found continuing N19 QA (2026-10-18): root cause behind
-- several of today's "legacy account" gaps (unlock_candidate, and the
-- band-aid fallbacks added to every RLS policy fixed today). claim_company
-- (called from ClaimBanner.tsx) only ever inserted into company_admins
-- (dead table, see 20261018_fix_dashboard_rpc_authorization.sql and
-- 20261018_fix_company_admins_dead_table_policies.sql) and set
-- user_profiles.company_id directly -- it was never updated to also
-- create a company_members row once company_members became the real
-- team/permissions table on 2026-04-29.
--
-- The one-time "Owner backfill" in 20260429_company_permissions_phase1.sql
-- only covered whoever existed at that moment. Every company claimed since
-- then has zero company_members row, and is_company_owner_or_admin() --
-- the function gating company_members/company_invitations RLS, with no
-- legacy fallback at all -- always returns false for them. Confirmed by
-- reading TeamMembers.tsx: usePermissions()'s `member` comes from
-- company_members, and the page's own guard renders "No company
-- membership found" when it's null. Net effect: any company claimed in
-- the last ~6 months cannot open the Team Members page at all, not even
-- in a degraded state -- a harder lockout than the "silently no-ops" or
-- "cross-tenant leak" shapes found elsewhere today.
--
-- Fixed at the source: claim_company now also inserts the company_members
-- owner row, so every future claim is correct from the start. Paired with
-- a backfill for every company claimed between 2026-04-29 and today that's
-- currently stuck in the gap.

CREATE OR REPLACE FUNCTION claim_company(target_slug text)
RETURNS jsonb AS $$
DECLARE
  _user_id uuid := auth.uid();
  _user_email text;
  _user_domain text;
  _company record;
  _already_admin boolean;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  _user_domain := LOWER(SPLIT_PART(_user_email, '@', 2));

  SELECT id, name, slug, email_domain, claimed_at INTO _company
  FROM companies WHERE slug = target_slug;

  IF _company.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'company_not_found');
  END IF;

  IF _company.email_domain IS NULL THEN
    UPDATE companies SET email_domain = _user_domain WHERE id = _company.id;
    _company.email_domain := _user_domain;
  END IF;

  IF LOWER(_company.email_domain) <> _user_domain THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'email_domain_mismatch',
      'required_domain', _company.email_domain
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM company_admins
    WHERE company_id = _company.id AND user_id = _user_id
  ) INTO _already_admin;

  IF NOT _already_admin THEN
    INSERT INTO company_admins (company_id, user_id, role)
    VALUES (_company.id, _user_id, 'owner');
  END IF;

  -- The real team/permissions table (company_admins above is vestigial,
  -- kept only so we don't break anything else still reading it).
  INSERT INTO company_members (company_id, user_id, role, scope, status, joined_at)
  VALUES (_company.id, _user_id, 'owner', 'all', 'active', now())
  ON CONFLICT (company_id, user_id) DO NOTHING;

  INSERT INTO company_claims (company_id, user_id, email_used, status, decided_at, decided_by)
  VALUES (_company.id, _user_id, _user_email, 'approved', now(), _user_id);

  UPDATE companies
  SET claimed_at = COALESCE(claimed_at, now())
  WHERE id = _company.id;

  UPDATE user_profiles
  SET role = 'company',
      company_id = _company.id
  WHERE id = _user_id
    AND role NOT IN ('admin');

  RETURN jsonb_build_object('success', true, 'company_id', _company.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: every company claimed between the 2026-04-29 one-time backfill
-- and today that's currently missing its company_members owner row.
INSERT INTO company_members (company_id, user_id, role, scope, status, joined_at)
SELECT
  up.company_id,
  up.id,
  'owner',
  'all',
  'active',
  COALESCE(up.created_at, now())
FROM user_profiles up
WHERE up.role = 'company'
  AND up.company_id IS NOT NULL
ON CONFLICT (company_id, user_id) DO NOTHING;
