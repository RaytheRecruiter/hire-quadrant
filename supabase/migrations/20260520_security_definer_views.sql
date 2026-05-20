-- Per Supabase Advisor 2026-05-20: three views were created without
-- explicit `security_invoker = on`, so by default they run as the
-- creator (postgres) and bypass the querying user's RLS. The Advisor
-- correctly flags this as a footgun.
--
-- Resolution per view:
--   1. public_company_directory — flip to security_invoker. Underlying
--      tables (companies, jobs, company_reviews) already have public-read
--      RLS for active/approved rows, so anon + authenticated reads
--      continue to work.
--   2. admin_audit_feed — flip to security_invoker. audit_log already
--      gates SELECT on role='admin', so non-admins will see empty results
--      and admins keep full access. user_profiles is also gated by the
--      new policies from migration 20260520_user_profiles_rls.sql.
--   3. my_auth_sessions — auth.sessions requires privileged read, so
--      security_invoker would break it. Replace the view with a
--      SECURITY DEFINER function that explicitly filters to auth.uid().
--      Frontend updated to call .rpc('get_my_auth_sessions') instead of
--      .from('my_auth_sessions').

-- ─── 1. public_company_directory ─────────────────────────────────────────
alter view public_company_directory set (security_invoker = on);

-- ─── 2. admin_audit_feed ─────────────────────────────────────────────────
alter view admin_audit_feed set (security_invoker = on);

-- ─── 3. my_auth_sessions → get_my_auth_sessions() ────────────────────────
-- Drop the view and replace with a SECURITY DEFINER function. Frontend
-- now calls supabase.rpc('get_my_auth_sessions').
drop view if exists my_auth_sessions;

create or replace function get_my_auth_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  not_after timestamptz,
  user_id uuid,
  user_agent text,
  ip inet
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select s.id, s.created_at, s.updated_at, s.not_after, s.user_id, s.user_agent, s.ip
  from auth.sessions s
  where s.user_id = auth.uid()
  order by s.updated_at desc;
$$;

grant execute on function get_my_auth_sessions() to authenticated;
