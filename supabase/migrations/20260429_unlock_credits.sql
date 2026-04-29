-- Per Scott 2026-04-29 Phase 2 #5: candidate unlock credits.
--
-- Model: each plan grants N unlock credits per billing period. Spending
-- a credit reveals a candidate's contact info + resume to the whole
-- company for the rest of that period (so a teammate doesn't burn a
-- second credit on the same person). Unlocks are scoped to the candidate
-- search surface (ResumeSearch) — applicants who applied to a job are
-- already visible per existing flows.
--
-- New surfaces wired in the same PR:
--   - ResumeSearch shows masked contact + "Unlock" button per row.
--   - CompanyBillingPanel surfaces credits used / remaining.

-- ─── plan field: monthly credit allowance ────────────────────────────────
alter table subscription_plans
  add column if not exists monthly_unlock_credits integer not null default 0;

-- ─── candidate_unlocks table ──────────────────────────────────────────────
create table if not exists candidate_unlocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  unlocked_by uuid references auth.users(id) on delete set null,
  unlocked_at timestamptz not null default now(),
  -- period_start anchors the unlock to a billing period so the charge
  -- doesn't carry over to a fresh allocation. Pulled from
  -- subscriptions.current_period_start at unlock time.
  period_start timestamptz not null default now(),
  unique (company_id, candidate_user_id, period_start)
);

create index if not exists idx_candidate_unlocks_company_period
  on candidate_unlocks(company_id, period_start desc);
create index if not exists idx_candidate_unlocks_candidate
  on candidate_unlocks(candidate_user_id);

alter table candidate_unlocks enable row level security;

-- A company member sees their own company's unlocks (so the UI can
-- detect already-unlocked rows). Admins/Owners can write via the RPC.
drop policy if exists "cu_company_select" on candidate_unlocks;
create policy "cu_company_select"
  on candidate_unlocks for select
  to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = candidate_unlocks.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
  );

-- No direct INSERT/UPDATE/DELETE — go through unlock_candidate RPC.

-- ─── unlocks_remaining helper ────────────────────────────────────────────
-- Returns the credit allowance + used + remaining for a given company
-- in their current billing period.
create or replace function unlocks_remaining(p_company_id uuid)
returns table (
  total integer,
  used integer,
  remaining integer,
  period_start timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with sub as (
    select s.current_period_start, sp.monthly_unlock_credits
    from subscriptions s
    join subscription_plans sp on sp.id = s.plan_id
    where s.company_id = p_company_id
      and s.status in ('active', 'trialing')
    order by s.updated_at desc
    limit 1
  ),
  -- If subscriptions don't have current_period_start populated, anchor
  -- to the start of the current calendar month so we still rotate.
  resolved as (
    select
      coalesce((select monthly_unlock_credits from sub), 0) as total,
      coalesce(
        (select current_period_start from sub),
        date_trunc('month', now())
      ) as period_start
  ),
  used as (
    select count(*)::int as n
    from candidate_unlocks cu, resolved
    where cu.company_id = p_company_id
      and cu.period_start >= resolved.period_start
  )
  select
    resolved.total,
    used.n as used,
    greatest(resolved.total - used.n, 0) as remaining,
    resolved.period_start
  from resolved, used;
$$;

grant execute on function unlocks_remaining(uuid) to authenticated;

-- ─── unlock_candidate RPC ────────────────────────────────────────────────
-- Spends one credit from the caller's company. Idempotent within a
-- billing period: if the candidate is already unlocked, returns the
-- existing row id without consuming a new credit.
create or replace function unlock_candidate(p_candidate_user_id uuid)
returns table (
  unlock_id uuid,
  remaining integer,
  already_unlocked boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_period_start timestamptz;
  v_allowance integer;
  v_used integer;
  v_unlock_id uuid;
  v_existing uuid;
begin
  if v_user_id is null then
    raise exception 'Must be signed in';
  end if;

  -- Resolve the caller's active company membership.
  select cm.company_id into v_company_id
  from company_members cm
  where cm.user_id = v_user_id and cm.status = 'active'
  limit 1;

  if v_company_id is null then
    raise exception 'You are not linked to a company account';
  end if;

  -- Pull plan details + period start.
  select sp.monthly_unlock_credits,
         coalesce(s.current_period_start, date_trunc('month', now()))
    into v_allowance, v_period_start
  from subscriptions s
  join subscription_plans sp on sp.id = s.plan_id
  where s.company_id = v_company_id
    and s.status in ('active', 'trialing')
  order by s.updated_at desc
  limit 1;

  -- No active subscription → no credits.
  if v_allowance is null then
    raise exception 'No active subscription with unlock credits';
  end if;

  -- Already unlocked this period? Return the existing row.
  select cu.id into v_existing
  from candidate_unlocks cu
  where cu.company_id = v_company_id
    and cu.candidate_user_id = p_candidate_user_id
    and cu.period_start >= v_period_start
  limit 1;

  if v_existing is not null then
    select count(*) into v_used
    from candidate_unlocks
    where company_id = v_company_id and period_start >= v_period_start;
    return query select v_existing, greatest(v_allowance - v_used, 0)::int, true;
    return;
  end if;

  -- Count current usage to enforce the cap.
  select count(*) into v_used
  from candidate_unlocks
  where company_id = v_company_id and period_start >= v_period_start;

  if v_used >= v_allowance then
    raise exception 'No unlock credits remaining this billing period';
  end if;

  insert into candidate_unlocks (company_id, candidate_user_id, unlocked_by, period_start)
  values (v_company_id, p_candidate_user_id, v_user_id, v_period_start)
  returning id into v_unlock_id;

  return query select v_unlock_id, greatest(v_allowance - (v_used + 1), 0)::int, false;
end;
$$;

grant execute on function unlock_candidate(uuid) to authenticated;
