-- Phase 2 of Ray's Nexegin/HireQuadrant monetization spec (2026-08-14):
-- Job Sponsorship (PROMOTE) — one-time, per-job purchases. Reuses the
-- existing jobs.is_sponsored/sponsor_tier/sponsor_start_date/sponsor_end_date
-- columns (20260417000002) and src/utils/jobScoring.ts ranking, which
-- already read these correctly — they just were never driven by a real
-- payment before (CompanyJobsList.tsx's old dropdown wrote them for free).
--
-- Note: jobs.sponsored_until (20260425_candidate_ux.sql) is a separate,
-- dead column — not touched here, do not confuse with sponsor_end_date.

-- 1. Sponsorship tiers, centralized like subscription_plans /
--    contact_credit_packs so pricing isn't hard-coded.
create table if not exists sponsorship_plans (
  id uuid primary key default gen_random_uuid(),
  tier integer not null unique,
  name text not null,
  price_cents integer not null,
  duration_days integer not null,
  stripe_price_id text,
  features jsonb default '[]',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into sponsorship_plans (tier, name, price_cents, duration_days, features, sort_order)
values
  (1, 'Sponsored', 4900, 7, '["Boosted placement for 7 days","Sponsored badge"]', 0),
  (2, 'Sponsored Plus', 9900, 14, '["Boosted placement for 14 days","Sponsored badge","Most Popular"]', 1),
  (3, 'Featured', 17900, 30, '["Top placement for 30 days","Sponsored badge","Featured badge"]', 2)
on conflict (tier) do nothing;

alter table sponsorship_plans enable row level security;

drop policy if exists "Anyone can read active sponsorship plans" on sponsorship_plans;
create policy "Anyone can read active sponsorship plans"
  on sponsorship_plans for select
  using (is_active = true);

drop policy if exists "Admins can manage sponsorship plans" on sponsorship_plans;
create policy "Admins can manage sponsorship plans"
  on sponsorship_plans for all to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- 2. Job add-ons (currently just Urgent Hiring; generic key/value shape so
--    a second add-on later doesn't need a new table).
create table if not exists job_addons (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  price_cents integer not null,
  duration_days integer not null,
  stripe_price_id text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into job_addons (key, name, price_cents, duration_days)
values ('urgent_hiring', 'Urgent Hiring', 3900, 7)
on conflict (key) do nothing;

alter table job_addons enable row level security;

drop policy if exists "Anyone can read active job addons" on job_addons;
create policy "Anyone can read active job addons"
  on job_addons for select
  using (is_active = true);

drop policy if exists "Admins can manage job addons" on job_addons;
create policy "Admins can manage job addons"
  on job_addons for all to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- 3. Urgent Hiring flag on jobs, mirroring the sponsor_* column pattern.
alter table jobs
  add column if not exists is_urgent boolean default false,
  add column if not exists urgent_until timestamptz;

create index if not exists idx_jobs_urgent on jobs(is_urgent) where is_urgent = true;

-- 4. Purchase ledger — admin visibility/audit trail for sponsorship spend
--    (spec §24/§27 partial). jobs.id is text, not uuid.
create table if not exists job_sponsorship_orders (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references jobs(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  tier integer,
  price_cents_paid integer not null,
  duration_days integer not null,
  addon_urgent boolean not null default false,
  addon_price_cents integer default 0,
  stripe_checkout_session_id text,
  purchased_by uuid references auth.users(id) on delete set null,
  purchased_at timestamptz not null default now()
);

create index if not exists idx_sponsorship_orders_company on job_sponsorship_orders(company_id, purchased_at desc);
create index if not exists idx_sponsorship_orders_job on job_sponsorship_orders(job_id);

alter table job_sponsorship_orders enable row level security;

drop policy if exists "Company can read own sponsorship orders" on job_sponsorship_orders;
create policy "Company can read own sponsorship orders"
  on job_sponsorship_orders for select to authenticated
  using (
    exists (
      select 1 from company_members cm
      where cm.company_id = job_sponsorship_orders.company_id
        and cm.user_id = auth.uid()
        and cm.status = 'active'
    )
  );

drop policy if exists "Admins can read all sponsorship orders" on job_sponsorship_orders;
create policy "Admins can read all sponsorship orders"
  on job_sponsorship_orders for select to authenticated
  using (exists (select 1 from user_profiles where id = auth.uid() and role = 'admin'));

-- No direct client INSERT — only the stripe-webhook service role writes here.
