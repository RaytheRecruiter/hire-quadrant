-- PR X19: Job referral program. A candidate shares a job via a unique
-- link; if the referee applies and gets hired, the referrer earns a
-- referral credit. Rewards are tracked — payout is handled off-platform
-- by the employer (this is just the tracking layer).

create table if not exists job_referrals (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references jobs(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referee_id uuid references auth.users(id) on delete set null,
  code text not null unique default encode(gen_random_bytes(6), 'hex'),
  referee_email text,
  status text not null default 'shared' check (status in (
    'shared','clicked','applied','interviewed','hired','paid','expired','void'
  )),
  reward_amount_cents int,
  shared_at timestamptz not null default now(),
  clicked_at timestamptz,
  applied_at timestamptz,
  hired_at timestamptz,
  expires_at timestamptz not null default (now() + interval '90 days'),
  metadata jsonb default '{}'::jsonb
);

create index if not exists job_referrals_job_idx on job_referrals(job_id);
create index if not exists job_referrals_referrer_idx on job_referrals(referrer_id, shared_at desc);
create index if not exists job_referrals_code_idx on job_referrals(code);
create index if not exists job_referrals_referee_idx on job_referrals(referee_id) where referee_id is not null;

alter table job_referrals enable row level security;

drop policy if exists job_referrals_self_read on job_referrals;
create policy job_referrals_self_read
  on job_referrals for select
  using (
    referrer_id = auth.uid()
    or referee_id = auth.uid()
    or exists (select 1 from user_profiles p where p.id = auth.uid() and p.role in ('admin','company'))
  );

drop policy if exists job_referrals_insert on job_referrals;
create policy job_referrals_insert
  on job_referrals for insert
  with check (referrer_id = auth.uid());

-- Track click: called when someone lands on /jobs/:id?ref=CODE
create or replace function track_referral_click(p_code text)
returns void language sql security definer as $$
  update job_referrals
     set clicked_at = coalesce(clicked_at, now()),
         status = case when status = 'shared' then 'clicked' else status end
   where code = p_code
     and expires_at > now();
$$;

grant execute on function track_referral_click(text) to anon, authenticated;

-- Attach referee when they apply (job application with ref cookie/param)
create or replace function attach_referral_to_application(p_code text, p_referee_id uuid)
returns void language sql security definer as $$
  update job_referrals
     set referee_id = p_referee_id,
         applied_at = coalesce(applied_at, now()),
         status = case when status in ('shared','clicked') then 'applied' else status end
   where code = p_code
     and expires_at > now()
     and (referee_id is null or referee_id = p_referee_id);
$$;

grant execute on function attach_referral_to_application(text, uuid) to authenticated;
