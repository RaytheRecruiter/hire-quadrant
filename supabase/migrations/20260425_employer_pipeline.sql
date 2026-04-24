-- PR X6 employer pipeline: CRM notes, tags, custom fields, team invites,
-- bulk messaging, scheduled interviews, sponsored listings (column was
-- added in X5 — employer UI wiring goes here).
-- Idempotent.

-- 1. Applicant notes --------------------------------------------------------
create table if not exists applicant_notes (
  id uuid primary key default gen_random_uuid(),
  application_id text not null, -- matches job_applications.id (text)
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table applicant_notes
  alter column application_id type text using application_id::text;

create index if not exists applicant_notes_app_idx
  on applicant_notes(application_id, created_at desc);

alter table applicant_notes enable row level security;

drop policy if exists applicant_notes_read on applicant_notes;
create policy applicant_notes_read
  on applicant_notes for select
  using (
    exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role in ('admin','company')
    )
  );

drop policy if exists applicant_notes_write on applicant_notes;
create policy applicant_notes_write
  on applicant_notes for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role in ('admin','company')
    )
  );

drop policy if exists applicant_notes_delete on applicant_notes;
create policy applicant_notes_delete
  on applicant_notes for delete
  using (author_id = auth.uid());

-- 2. Applicant tags ---------------------------------------------------------
create table if not exists applicant_tags (
  id uuid primary key default gen_random_uuid(),
  application_id text not null,
  tag text not null check (length(tag) between 1 and 40),
  author_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(application_id, tag)
);
alter table applicant_tags
  alter column application_id type text using application_id::text;

create index if not exists applicant_tags_app_idx on applicant_tags(application_id);

alter table applicant_tags enable row level security;

drop policy if exists applicant_tags_read on applicant_tags;
create policy applicant_tags_read
  on applicant_tags for select
  using (
    exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role in ('admin','company')
    )
  );

drop policy if exists applicant_tags_write on applicant_tags;
create policy applicant_tags_write
  on applicant_tags for all
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- 3. Custom application fields per job --------------------------------------
-- jobs.id is TEXT (see 20250722191000_small_snowflake.sql), so job_id must be text.
create table if not exists job_custom_fields (
  id uuid primary key default gen_random_uuid(),
  job_id text not null references jobs(id) on delete cascade,
  label text not null,
  field_type text not null check (field_type in ('short_text','long_text','yes_no','single_choice','multi_choice')),
  required boolean not null default false,
  options jsonb default '[]'::jsonb,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

-- Heal partial runs created with uuid.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'job_custom_fields'
      and column_name = 'job_id'
      and data_type = 'uuid'
  ) then
    -- Drop the broken FK constraint (may or may not exist), then retype.
    alter table job_custom_fields drop constraint if exists job_custom_fields_job_id_fkey;
    alter table job_custom_fields alter column job_id type text using job_id::text;
    alter table job_custom_fields
      add constraint job_custom_fields_job_id_fkey
      foreign key (job_id) references jobs(id) on delete cascade;
  end if;
end $$;

create index if not exists job_custom_fields_job_idx on job_custom_fields(job_id, order_index);

alter table job_custom_fields enable row level security;

drop policy if exists job_custom_fields_read on job_custom_fields;
create policy job_custom_fields_read
  on job_custom_fields for select
  using (true);

drop policy if exists job_custom_fields_write on job_custom_fields;
create policy job_custom_fields_write
  on job_custom_fields for all
  using (
    exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role in ('admin','company')
    )
  );

-- 4. Team invites -----------------------------------------------------------
create table if not exists company_team_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  code text not null unique default encode(gen_random_bytes(12), 'hex'),
  invited_role text not null default 'recruiter' check (invited_role in ('owner','recruiter','viewer')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create index if not exists company_team_invites_company_idx on company_team_invites(company_id);

alter table company_team_invites enable row level security;

drop policy if exists company_team_invites_read on company_team_invites;
create policy company_team_invites_read
  on company_team_invites for select
  using (
    exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role in ('admin','company')
    )
  );

drop policy if exists company_team_invites_write on company_team_invites;
create policy company_team_invites_write
  on company_team_invites for all
  using (
    invited_by = auth.uid()
    or exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 5. Scheduled interviews ---------------------------------------------------
create table if not exists scheduled_interviews (
  id uuid primary key default gen_random_uuid(),
  application_id text not null,
  scheduled_for timestamptz not null,
  duration_minutes int not null default 30,
  location text,
  meeting_url text,
  notes text,
  status text not null default 'proposed' check (status in ('proposed','confirmed','completed','cancelled')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table scheduled_interviews
  alter column application_id type text using application_id::text;

create index if not exists scheduled_interviews_app_idx
  on scheduled_interviews(application_id, scheduled_for);

alter table scheduled_interviews enable row level security;

drop policy if exists scheduled_interviews_read on scheduled_interviews;
create policy scheduled_interviews_read
  on scheduled_interviews for select
  using (
    exists (
      select 1 from job_applications a
      where a.id = application_id and a.user_id = auth.uid()
    )
    or exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role in ('admin','company')
    )
  );

drop policy if exists scheduled_interviews_write on scheduled_interviews;
create policy scheduled_interviews_write
  on scheduled_interviews for all
  using (
    exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role in ('admin','company')
    )
  );

-- 6. Bulk messages log ------------------------------------------------------
create table if not exists bulk_messages (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  recipient_ids uuid[] not null,
  subject text,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists bulk_messages_author_idx
  on bulk_messages(author_id, created_at desc);

alter table bulk_messages enable row level security;

drop policy if exists bulk_messages_read on bulk_messages;
create policy bulk_messages_read
  on bulk_messages for select
  using (author_id = auth.uid());

drop policy if exists bulk_messages_write on bulk_messages;
create policy bulk_messages_write
  on bulk_messages for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from user_profiles p
      where p.id = auth.uid() and p.role in ('admin','company')
    )
  );
