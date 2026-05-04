import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Search as SearchIcon, Briefcase, Loader2, X } from 'lucide-react';
import HardLink from '../components/HardLink';
import JobFilterSidebar, { AdvancedFilters, DEFAULT_ADVANCED_FILTERS } from '../components/JobFilterSidebar';
import AutocompleteField from '../components/AutocompleteField';
import { supabase } from '../utils/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface JobRow {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  type: string | null;
  salary: string | null;
  min_salary: number | null;
  max_salary: number | null;
  posted_date: string | null;
  experience_level: string | null;
  workplace_type: string | null;
  visa_sponsor: boolean | null;
  security_clearance: string | null;
  sponsored: boolean | null;
}

const PAGE_SIZE = 20;

// Radius filter state. Loaded once from the signed-in user's saved
// preferences; users can dismiss it for the current session via the
// chip × button. Per Scott 2026-04-29 (#6).
type RadiusPref = {
  miles: number;
  lat: number;
  lng: number;
  zip: string;
} | null;

const BrowseJobs: React.FC = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [loc, setLoc] = useState(params.get('loc') ?? '');
  const [radiusPref, setRadiusPref] = useState<RadiusPref>(null);
  const [radiusActive, setRadiusActive] = useState(true);

  // Load the user's saved radius preference once. If they have lat/lng +
  // a non-zero radius, we'll apply it by default; the chip can be dismissed.
  useEffect(() => {
    if (!user?.id) {
      setRadiusPref(null);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('user_job_preferences')
        .select('mile_radius, zip_lat, zip_lng, zip_code')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.mile_radius && data.zip_lat && data.zip_lng) {
        setRadiusPref({
          miles: data.mile_radius as number,
          lat: data.zip_lat as number,
          lng: data.zip_lng as number,
          zip: (data.zip_code as string) || '',
        });
      }
    })();
  }, [user?.id]);

  const [filters, setFilters] = useState<AdvancedFilters>({
    ...DEFAULT_ADVANCED_FILTERS,
    minSalary: parseInt(params.get('salary') ?? '0', 10) || 0,
    workplaceType: params.get('workplace') ?? '',
    experienceLevel: params.get('experience') ?? '',
    postedWithinDays: parseInt(params.get('posted') ?? '0', 10) || 0,
    visaSponsor: params.get('visa') === '1',
    securityClearance: params.get('clearance') ?? '',
  });
  const [rows, setRows] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const syncParams = (patch: Partial<AdvancedFilters>, search = q, location = loc) => {
    const next = new URLSearchParams();
    if (search) next.set('q', search);
    if (location) next.set('loc', location);
    const merged = { ...filters, ...patch };
    if (merged.minSalary > 0) next.set('salary', String(merged.minSalary));
    if (merged.workplaceType) next.set('workplace', merged.workplaceType);
    if (merged.experienceLevel) next.set('experience', merged.experienceLevel);
    if (merged.postedWithinDays > 0) next.set('posted', String(merged.postedWithinDays));
    if (merged.visaSponsor) next.set('visa', '1');
    if (merged.securityClearance) next.set('clearance', merged.securityClearance);
    setParams(next, { replace: true });
  };

  const updateFilters = (patch: Partial<AdvancedFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
    syncParams(patch);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchJobs = async () => {
      setLoading(true);

      // Resolve the radius filter first if active. Returns the set of job
      // ids within range; we then narrow the main query with .in('id', …).
      let nearbyIds: string[] | null = null;
      if (radiusActive && radiusPref && radiusPref.miles > 0) {
        const { data: nearby, error: nearbyError } = await supabase.rpc('nearby_job_ids', {
          p_lat: radiusPref.lat,
          p_lng: radiusPref.lng,
          p_miles: radiusPref.miles,
        });
        if (nearbyError) {
          console.warn('[BrowseJobs] nearby_job_ids failed, ignoring radius:', nearbyError);
        } else {
          nearbyIds = (nearby || []).map((r: { id: string }) => r.id);
        }
      }

      let query = supabase
        .from('jobs')
        .select(
          'id, title, company, location, type, salary, min_salary, max_salary, posted_date, created_at, experience_level, workplace_type, visa_sponsor, security_clearance, sponsored, description',
          { count: 'exact' },
        );

      if (q) {
        query = query.or(
          `title.ilike.%${q}%,company.ilike.%${q}%,description.ilike.%${q}%`,
        );
      }
      if (loc) query = query.ilike('location', `%${loc}%`);

      // Filter UX fixes — Ray's QA pass on 2026-04-30 surfaced that the
      // dedicated columns (experience_level, workplace_type, security_clearance,
      // visa_sponsor) are NULL on every job because the JobDiva XML feed
      // doesn't populate them, and min_salary is stored in kilobucks
      // (e.g. 130 for $130k) while the slider sends raw dollars. Fall back
      // to text search on title + description for the qualitative filters,
      // and divide the salary slider value by 1000.
      if (filters.minSalary > 0) {
        query = query.gte('min_salary', Math.round(filters.minSalary / 1000));
      }
      if (filters.experienceLevel) {
        const term = filters.experienceLevel;
        query = query.or(
          `experience_level.eq.${term},title.ilike.%${term}%,description.ilike.%${term}%`,
        );
      }
      if (filters.workplaceType) {
        const term = filters.workplaceType;
        // Hybrid is rare in titles; widen the search to location too.
        query = query.or(
          `workplace_type.eq.${term},title.ilike.%${term}%,location.ilike.%${term}%,description.ilike.%${term}%`,
        );
      }
      if (filters.visaSponsor) {
        query = query.or(
          'visa_sponsor.eq.true,description.ilike.%visa sponsor%,description.ilike.%h-1b%,description.ilike.%h1b%',
        );
      }
      if (filters.securityClearance) {
        const map: Record<string, string> = {
          public_trust: 'public trust',
          secret: 'secret',
          top_secret: 'top secret',
          ts_sci: 'TS/SCI',
          none: '',
        };
        const term = map[filters.securityClearance] ?? filters.securityClearance;
        if (term) {
          query = query.or(
            `security_clearance.eq.${filters.securityClearance},description.ilike.%${term}%`,
          );
        }
      }
      if (filters.postedWithinDays > 0) {
        const since = new Date(Date.now() - filters.postedWithinDays * 24 * 60 * 60 * 1000).toISOString();
        // posted_date is null on most ingested rows; fall back to created_at.
        query = query.or(`posted_date.gte.${since},and(posted_date.is.null,created_at.gte.${since})`);
      }
      if (nearbyIds !== null) {
        // Empty array → zero results (Supabase handles this fine).
        query = query.in('id', nearbyIds);
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await query
        .order('sponsored', { ascending: false })
        .order('posted_date', { ascending: false })
        .range(from, to);

      if (cancelled) return;
      if (error) {
        console.error('[BrowseJobs] supabase query failed:', error);
        setError(error.message ?? 'Failed to load jobs');
        setRows([]);
        setTotal(0);
      } else {
        setError(null);
        setRows((data ?? []) as JobRow[]);
        setTotal(count ?? 0);
      }
      setLoading(false);
    };
    fetchJobs();
    return () => {
      cancelled = true;
    };
  }, [q, loc, filters, page, radiusActive, radiusPref]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const resultsCopy = useMemo(() => {
    if (loading) return 'Searching…';
    if (error) return `Error loading jobs: ${error}`;
    if (total === 0) return 'No jobs match your filters';
    return `${total.toLocaleString()} ${total === 1 ? 'job' : 'jobs'}`;
  }, [loading, error, total]);

  return (
    <>
      <Helmet>
        <title>Browse Jobs · HireQuadrant</title>
        <meta name="description" content="Browse thousands of open jobs. Filter by salary, experience level, workplace type, visa sponsorship, and security clearance." />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-1">
              Browse Jobs
            </h1>
            <p className="text-gray-600 dark:text-slate-400 text-sm">{resultsCopy}</p>
          </header>

          <form
            className="flex flex-col sm:flex-row gap-2 mb-5"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(0);
              syncParams({}, q, loc);
            }}
          >
            <AutocompleteField
              value={q}
              onChange={setQ}
              placeholder="Job title, skill, company"
              icon={<SearchIcon className="h-4 w-4" />}
              column="title"
              className="flex-1"
            />
            <AutocompleteField
              value={loc}
              onChange={setLoc}
              placeholder="City or remote"
              icon={<MapPin className="h-4 w-4" />}
              column="location"
              className="flex-1"
            />
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              Search
            </button>
          </form>

          {radiusPref && radiusPref.miles > 0 && (
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              {radiusActive ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-medium border border-primary-200 dark:border-primary-800">
                  <MapPin className="h-3.5 w-3.5" />
                  Within {radiusPref.miles} mi of {radiusPref.zip || 'your ZIP'}
                  <button
                    type="button"
                    onClick={() => {
                      setRadiusActive(false);
                      setPage(0);
                    }}
                    className="ml-1 hover:text-rose-600"
                    aria-label="Remove radius filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setRadiusActive(true);
                    setPage(0);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-primary-300 hover:text-primary-600"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Filter to within {radiusPref.miles} mi of {radiusPref.zip || 'your ZIP'}
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            <JobFilterSidebar
              value={filters}
              onChange={updateFilters}
              onReset={() => {
                setFilters(DEFAULT_ADVANCED_FILTERS);
                setPage(0);
                syncParams(DEFAULT_ADVANCED_FILTERS);
              }}
              className="lg:sticky lg:top-4 lg:self-start"
            />

            <div>
              {loading ? (
                <div className="py-16 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
                </div>
              ) : rows.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center text-sm text-gray-500 dark:text-slate-400">
                  No jobs match these filters. Try broadening your search.
                </div>
              ) : (
                <ul className="space-y-3">
                  {rows.map((j) => (
                    <li key={j.id}>
                      <HardLink
                        to={`/jobs/${j.id}`}
                        className="block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 hover:border-primary-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="font-bold text-secondary-900 dark:text-white">{j.title}</h3>
                              {j.sponsored && (
                                <span className="text-[10px] uppercase tracking-wide bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                  Sponsored
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-secondary-700 dark:text-slate-300">{j.company}</p>
                            <div className="flex items-center gap-3 flex-wrap mt-2 text-xs text-gray-500 dark:text-slate-400">
                              {j.location && (
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {j.location}
                                </span>
                              )}
                              {j.type && (
                                <span className="inline-flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {j.type}
                                </span>
                              )}
                              {j.workplace_type && (
                                <span className="capitalize">{j.workplace_type}</span>
                              )}
                              {j.salary && <span>{j.salary}</span>}
                              {j.posted_date && (
                                <span>
                                  {formatDistanceToNow(new Date(j.posted_date), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </HardLink>
                    </li>
                  ))}
                </ul>
              )}

              {totalPages > 1 && (
                <nav
                  className="flex items-center justify-between mt-6"
                  aria-label="Pagination"
                >
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BrowseJobs;
