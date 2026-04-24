-- PR X18: Employer benchmarking RPC — returns my metrics + peer medians
-- for the same industry. Admin + company users only (enforced in app).

create or replace function employer_benchmarks(p_company_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  my_industry text;
  my_rating numeric;
  my_review_count int;
  my_job_count int;
  my_application_count int;
  peer_rating numeric;
  peer_review_count numeric;
  peer_job_count numeric;
  peer_application_count numeric;
begin
  select industry into my_industry from companies where id = p_company_id;

  -- My stats
  select coalesce(avg(rating)::numeric(3,2), 0), count(*)::int
    into my_rating, my_review_count
    from company_reviews
    where company_id = p_company_id
      and status = 'approved'
      and deleted_at is null;

  select count(*)::int into my_job_count
    from jobs where company_id = p_company_id;

  select count(*)::int into my_application_count
    from job_applications a
    join jobs j on j.id = a.job_id
    where j.company_id = p_company_id;

  -- Peer medians (same industry, excluding me)
  select
    percentile_cont(0.5) within group (order by r.avg_rating),
    percentile_cont(0.5) within group (order by r.cnt),
    percentile_cont(0.5) within group (order by j.cnt),
    percentile_cont(0.5) within group (order by a.cnt)
    into peer_rating, peer_review_count, peer_job_count, peer_application_count
    from companies c
    left join (
      select company_id, avg(rating)::numeric(3,2) as avg_rating, count(*) as cnt
        from company_reviews
        where status = 'approved' and deleted_at is null
        group by company_id
    ) r on r.company_id = c.id
    left join (
      select company_id, count(*) as cnt from jobs group by company_id
    ) j on j.company_id = c.id
    left join (
      select j2.company_id, count(*) as cnt
        from job_applications a2
        join jobs j2 on j2.id = a2.job_id
        group by j2.company_id
    ) a on a.company_id = c.id
    where c.industry = my_industry
      and c.id <> p_company_id;

  return jsonb_build_object(
    'industry', my_industry,
    'my', jsonb_build_object(
      'rating', my_rating,
      'review_count', my_review_count,
      'job_count', my_job_count,
      'application_count', my_application_count
    ),
    'peer_median', jsonb_build_object(
      'rating', coalesce(peer_rating, 0),
      'review_count', coalesce(peer_review_count, 0),
      'job_count', coalesce(peer_job_count, 0),
      'application_count', coalesce(peer_application_count, 0)
    )
  );
end;
$$;

grant execute on function employer_benchmarks(uuid) to authenticated;
