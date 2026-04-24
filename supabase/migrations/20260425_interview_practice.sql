-- PR X23: Interview practice session log. Stores each practice attempt
-- so users can see history + progress over time.

create table if not exists interview_practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_target text,
  question_type text not null default 'behavioral' check (question_type in ('behavioral','technical','system-design','role-specific')),
  question text not null,
  answer text not null,
  score int,
  summary text,
  strengths jsonb default '[]'::jsonb,
  improvements jsonb default '[]'::jsonb,
  better_example text,
  created_at timestamptz not null default now()
);

create index if not exists interview_practice_user_idx
  on interview_practice_sessions(user_id, created_at desc);

alter table interview_practice_sessions enable row level security;

drop policy if exists ips_self on interview_practice_sessions;
create policy ips_self on interview_practice_sessions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
