-- Phase 1 of Ray's Nexegin/HireQuadrant monetization spec (2026-08-14):
-- "Post for Free. Promote when you need more applicants. Source when you
-- want to find candidates yourself." Per Rafael's direction, job posting
-- is now always free (the old job_limit gate is retired), and the
-- Resume Database (SOURCE) product is built first, reusing the existing
-- subscription_plans/subscriptions tables and the working unlock-credit
-- system from 20260429_unlock_credits.sql instead of new tables.
--
-- price_monthly/price_yearly are stored in CENTS in the new rows below —
-- CompanyBillingPanel.tsx's fmtPrice() has always divided by 100, but the
-- original 20260407000007 seed stored dollars, which was a latent display
-- bug. New rows match what the code actually expects; old dollar-valued
-- rows are deactivated, not fixed in place, so nothing that reads them
-- historically breaks.

-- 1. Retire the old job-limit-gated plans. Job posting no longer checks
--    subscription at all, so these rows (and job_limit generally) become
--    vestigial. Deactivate rather than delete: subscriptions.plan_id has
--    no ON DELETE behavior defined, and any existing company subscription
--    rows should keep resolving rather than 23503 on this migration.
update subscription_plans
set is_active = false
where slug in ('free', 'basic', 'premium', 'enterprise');

-- 2. Seed the 3 purchasable Resume Database tiers. Enterprise is
--    "Contact Sales" per spec — not a purchasable row, rendered as a
--    static card in the UI instead.
insert into subscription_plans
  (name, slug, job_limit, price_monthly, price_yearly, monthly_unlock_credits, features, is_active, sort_order)
values
  ('Starter', 'resume-starter', -1, 7900, 79000, 25,
   '["25 candidate unlocks / month","Full resume database search","Email support"]', true, 10),
  ('Pro', 'resume-pro', -1, 14900, 149000, 75,
   '["75 candidate unlocks / month","Full resume database search","Advanced filters","Priority support","Most Popular"]', true, 11),
  ('Business', 'resume-business', -1, 29900, 299000, 200,
   '["200 candidate unlocks / month","Full resume database search","Advanced filters","Team seats","Dedicated support"]', true, 12)
on conflict (slug) do nothing;

-- 3. Stripe Price IDs — populated later via the admin pricing panel once
--    Rafael creates the corresponding Products/Prices in the Stripe
--    Dashboard (no Stripe account exists yet as of this migration).
alter table subscription_plans
  add column if not exists stripe_price_id_monthly text,
  add column if not exists stripe_price_id_annual text;

-- 4. Billing frequency + non-resetting purchased add-on credits.
alter table subscriptions
  add column if not exists billing_frequency text not null default 'monthly'
    check (billing_frequency in ('monthly', 'annual')),
  add column if not exists purchased_contacts_remaining integer not null default 0;

-- 5. Track which bucket an unlock drew from, so purchased add-on credits
--    (which never auto-reset) are visibly distinct from the monthly
--    allowance in the ledger.
alter table candidate_unlocks
  add column if not exists credit_source text not null default 'monthly'
    check (credit_source in ('monthly', 'purchased'));

-- 6. unlocks_remaining: also report the purchased-credit bucket.
create or replace function unlocks_remaining(p_company_id uuid)
returns table (
  total integer,
  used integer,
  remaining integer,
  purchased_remaining integer,
  period_start timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with sub as (
    select s.current_period_start, s.purchased_contacts_remaining, sp.monthly_unlock_credits
    from subscriptions s
    join subscription_plans sp on sp.id = s.plan_id
    where s.company_id = p_company_id
      and s.status in ('active', 'trialing')
    order by s.updated_at desc
    limit 1
  ),
  resolved as (
    select
      coalesce((select monthly_unlock_credits from sub), 0) as total,
      coalesce((select purchased_contacts_remaining from sub), 0) as purchased_remaining,
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
      and cu.credit_source = 'monthly'
  )
  select
    resolved.total,
    used.n as used,
    greatest(resolved.total - used.n, 0) as remaining,
    resolved.purchased_remaining,
    resolved.period_start
  from resolved, used;
$$;

grant execute on function unlocks_remaining(uuid) to authenticated;

-- 7. unlock_candidate: draw from the monthly allowance first, then fall
--    back to purchased_contacts_remaining before rejecting.
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
  v_purchased_remaining integer;
  v_used integer;
  v_unlock_id uuid;
  v_existing uuid;
  v_source text;
begin
  if v_user_id is null then
    raise exception 'Must be signed in';
  end if;

  select cm.company_id into v_company_id
  from company_members cm
  where cm.user_id = v_user_id and cm.status = 'active'
  limit 1;

  if v_company_id is null then
    raise exception 'You are not linked to a company account';
  end if;

  select sp.monthly_unlock_credits,
         s.purchased_contacts_remaining,
         coalesce(s.current_period_start, date_trunc('month', now()))
    into v_allowance, v_purchased_remaining, v_period_start
  from subscriptions s
  join subscription_plans sp on sp.id = s.plan_id
  where s.company_id = v_company_id
    and s.status in ('active', 'trialing')
  order by s.updated_at desc
  limit 1;

  if v_allowance is null then
    raise exception 'No active subscription with unlock credits';
  end if;

  select cu.id into v_existing
  from candidate_unlocks cu
  where cu.company_id = v_company_id
    and cu.candidate_user_id = p_candidate_user_id
    and cu.period_start >= v_period_start
  limit 1;

  if v_existing is not null then
    select count(*) into v_used
    from candidate_unlocks
    where company_id = v_company_id and period_start >= v_period_start and credit_source = 'monthly';
    return query select v_existing, greatest(v_allowance - v_used, 0)::int, true;
    return;
  end if;

  select count(*) into v_used
  from candidate_unlocks
  where company_id = v_company_id and period_start >= v_period_start and credit_source = 'monthly';

  if v_used < v_allowance then
    v_source := 'monthly';
  elsif coalesce(v_purchased_remaining, 0) > 0 then
    v_source := 'purchased';
    update subscriptions
    set purchased_contacts_remaining = purchased_contacts_remaining - 1
    where company_id = v_company_id;
  else
    raise exception 'No unlock credits remaining this billing period';
  end if;

  insert into candidate_unlocks (company_id, candidate_user_id, unlocked_by, period_start, credit_source)
  values (v_company_id, p_candidate_user_id, v_user_id, v_period_start, v_source)
  returning id into v_unlock_id;

  return query select
    v_unlock_id,
    case when v_source = 'monthly' then greatest(v_allowance - (v_used + 1), 0)::int else greatest(v_allowance - v_used, 0)::int end,
    false;
end;
$$;

grant execute on function unlock_candidate(uuid) to authenticated;

-- 8. Contact credit packs (one-time "buy more contacts" add-ons, spec §18).
--    Centralized like subscription_plans instead of hard-coded in the
--    frontend, per the spec's explicit "do not hard-code pricing" note.
create table if not exists contact_credit_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits integer not null,
  price_cents integer not null,
  stripe_price_id text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into contact_credit_packs (name, credits, price_cents, sort_order)
values
  ('25 Contacts', 25, 3900, 0),
  ('50 Contacts', 50, 6900, 1),
  ('100 Contacts', 100, 11900, 2)
on conflict do nothing;

alter table contact_credit_packs enable row level security;

drop policy if exists "Anyone can read active credit packs" on contact_credit_packs;
create policy "Anyone can read active credit packs"
  on contact_credit_packs for select
  using (is_active = true);

drop policy if exists "Admins can manage credit packs" on contact_credit_packs;
create policy "Admins can manage credit packs"
  on contact_credit_packs for all to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));
