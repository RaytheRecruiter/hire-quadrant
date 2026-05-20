-- The `check_auth_rate_limit` function was written against column names
-- `attempted_at` and `success`, but the `auth_attempts` table actually
-- has `created_at` and `succeeded`. Two separate migrations from the
-- same day (20260425_trust_bundle.sql vs 20260425_security_and_compliance.sql)
-- shipped with different naming conventions.
--
-- Result: every sign-in attempt logs two 4xx errors in the browser
-- console:
--   - 400 /rpc/check_auth_rate_limit :: column "attempted_at" does not exist
--   - 400 /rest/v1/auth_attempts     :: Could not find the 'success' column
-- The page still completes (the rate-limit check defaults to allow on
-- error), but the rate-limit is non-functional and the audit insert
-- is silently failing.
--
-- Fix the function to match the actual table columns. The Login.tsx
-- insert is updated in the same PR (`success` → `succeeded`).

create or replace function check_auth_rate_limit(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  select count(*)
    into recent
    from auth_attempts
    where lower(email) = lower(p_email)
      and created_at > now() - interval '10 minutes'
      and succeeded = false;
  return recent < 8;
end;
$$;

-- Re-apply grants in case the redefine altered them (it shouldn't, but
-- be explicit since today's advisor cleanup touched these).
revoke execute on function check_auth_rate_limit(text) from public;
grant execute on function check_auth_rate_limit(text) to anon, authenticated;
