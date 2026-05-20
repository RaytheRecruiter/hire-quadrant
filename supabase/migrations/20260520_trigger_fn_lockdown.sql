-- Per Supabase Advisor 2026-05-20: PR #108 cleared the
-- `anon_security_definer_function_executable` warnings, but
-- `authenticated_security_definer_function_executable` is a separate
-- linter rule that flags every public.* SD function callable by a
-- signed-in user. Most of those are intentional RPCs (need elevated
-- access to read auth.sessions, do cross-company aggregation, etc.)
-- and can't be cleared without moving them to a non-public schema.
--
-- BUT — the list includes ~9 trigger functions that should never be
-- callable as RPCs in the first place. Triggers fire automatically
-- when their table event fires; they don't require EXECUTE to be
-- granted to any role. Exposing them via /rest/v1/rpc/<fn> is purely
-- a leftover from PG's default "grant EXECUTE to PUBLIC on CREATE".
--
-- Fix: revoke EXECUTE on every SECURITY DEFINER trigger function
-- (return type = `trigger`) from public, anon, and authenticated.
-- The triggers themselves keep firing because trigger invocation
-- bypasses EXECUTE checks — only direct calls / RPC are blocked.

do $$
declare
  rec record;
begin
  for rec in
    select
      n.nspname  as schema_name,
      p.proname  as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef = true
      and p.prokind   = 'f'
      and p.prorettype = 'pg_catalog.trigger'::regtype
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from public, anon, authenticated',
      rec.schema_name, rec.function_name, rec.args
    );
  end loop;
end
$$;
