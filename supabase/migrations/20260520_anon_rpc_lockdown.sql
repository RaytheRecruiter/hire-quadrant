-- Per Supabase Advisor 2026-05-20: tightens two attack surfaces.
--
-- 1) ~30+ SECURITY DEFINER functions in public.* were callable by the
--    `anon` role via PostgREST `/rest/v1/rpc/<fn>`. SECURITY DEFINER
--    functions run as the function's owner (postgres), so an
--    anon-callable SD function is a privilege boundary an attacker can
--    probe for side effects or info leaks. The PG default for
--    CREATE FUNCTION grants EXECUTE to PUBLIC (which includes anon).
--    Revoke that default, re-grant to `authenticated`, and keep anon
--    access only on a small allowlist that's deliberately pre-auth.
--
-- 2) The `avatars` storage bucket had an "Anyone reads avatars" SELECT
--    policy on storage.objects. Public buckets serve objects via
--    direct URL without needing a SELECT policy; the policy lets
--    clients LIST every file in the bucket, which is broader than
--    the app needs.
--
-- Out of scope for this PR (deferred with notes in PR body):
--   - extension_in_public (pg_net): needs app-side verification first
--   - rls_policy_always_true on telemetry tables (intentional)
--   - rls_policy_always_true on cache tables (need policy review)


-- ─── 1a) Revoke + re-grant on every public.* SECURITY DEFINER function ──
do $$
declare
  rec record;
begin
  for rec in
    select
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef = true
      and p.prokind = 'f'
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from public, anon',
      rec.schema_name, rec.function_name, rec.args
    );
    execute format(
      'grant execute on function %I.%I(%s) to authenticated',
      rec.schema_name, rec.function_name, rec.args
    );
  end loop;
end
$$;


-- ─── 1b) Re-grant anon access to the pre-auth allowlist ─────────────────
-- These RPCs are deliberately callable without a signed-in session.
-- The advisor will continue to flag these three; that's expected and
-- documented here so future reviewers know it's intentional.
--
--   check_auth_rate_limit  → invoked during sign-in/sign-up to throttle
--                            brute-force attempts before any session exists
--   increment_job_views    → anon job-card views should bump the counter
--   track_referral_click   → referral landing pages register clicks
--                            before signup

do $$
declare
  rec record;
begin
  for rec in
    select
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.proname in (
        'check_auth_rate_limit',
        'increment_job_views',
        'track_referral_click'
      )
  loop
    execute format(
      'grant execute on function %I.%I(%s) to anon',
      rec.schema_name, rec.function_name, rec.args
    );
  end loop;
end
$$;


-- ─── 2) Drop the avatars bucket's broad SELECT policy ───────────────────
-- The `avatars` bucket is configured `public = true`, so object URLs
-- resolve without an RLS check. The "Anyone reads avatars" SELECT
-- policy on storage.objects only adds the ability to LIST files,
-- which the app doesn't use.
drop policy if exists "Anyone reads avatars" on storage.objects;
