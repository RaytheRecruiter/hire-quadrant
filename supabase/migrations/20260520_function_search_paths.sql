-- Per Supabase Advisor 2026-05-20: dozens of public.* functions were
-- created without an explicit `set search_path = …`. That makes them
-- vulnerable to search_path hijacking — a low-privilege user can create
-- shadow objects in their own schema, and any unqualified name inside the
-- function body resolves against the caller's search_path first. For
-- SECURITY DEFINER functions this is a privilege-escalation footgun; for
-- the rest it's still hardening worth doing.
--
-- Fix: pin every public.* function to `search_path = public, pg_temp`
-- via ALTER FUNCTION. No body changes — function logic is untouched.
-- Bodies that reference `auth.uid()` etc. already schema-qualify, so the
-- pinned path doesn't break anything.
--
-- The DO block discovers ALL public functions missing a pinned
-- search_path, so it catches both the ~40 currently flagged and any
-- future additions. Idempotent — re-running is a no-op once everything
-- is pinned.

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
      and p.prokind in ('f', 'p')
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) cfg
        where cfg like 'search_path=%'
      )
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = public, pg_temp',
      rec.schema_name, rec.function_name, rec.args
    );
  end loop;
end
$$;
