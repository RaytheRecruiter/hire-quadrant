-- PR X11: cache for AI review summaries per company. Avoids re-calling
-- Claude on every profile view. Invalidate by deleting row when a new
-- review is added for that company.

create table if not exists company_review_summaries (
  company_id uuid primary key references companies(id) on delete cascade,
  summary text not null,
  pros_themes jsonb default '[]'::jsonb,
  cons_themes jsonb default '[]'::jsonb,
  recommended_for jsonb default '[]'::jsonb,
  based_on_count int not null default 0,
  generated_at timestamptz not null default now()
);

alter table company_review_summaries enable row level security;

drop policy if exists company_review_summaries_read on company_review_summaries;
create policy company_review_summaries_read
  on company_review_summaries for select using (true);

drop policy if exists company_review_summaries_write on company_review_summaries;
create policy company_review_summaries_write
  on company_review_summaries for all
  using (
    exists (select 1 from user_profiles p where p.id = auth.uid() and p.role in ('admin','company'))
  );

-- Invalidate summary when a new approved review lands.
create or replace function fn_invalidate_review_summary()
returns trigger language plpgsql security definer as $$
begin
  if new.company_id is not null
     and (tg_op = 'INSERT' or new.status is distinct from old.status) then
    delete from company_review_summaries where company_id = new.company_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invalidate_review_summary on company_reviews;
create trigger trg_invalidate_review_summary
  after insert or update of status on company_reviews
  for each row execute function fn_invalidate_review_summary();
