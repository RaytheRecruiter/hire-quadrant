import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { Scale, X, Plus, Star, Briefcase, Users, MapPin, Loader2 } from 'lucide-react';
import HardLink from '../components/HardLink';
import BreadcrumbSchema from '../components/BreadcrumbSchema';
import CompanyLogo from '../components/CompanyLogo';
import { supabase } from '../utils/supabaseClient';

interface CompanyCard {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  description: string | null;
  founded: string | null;
  rating_avg: number;
  rating_count: number;
  job_count: number;
  median_salary: number | null;
}

const ORIGIN = 'https://hirequadrant.com';
const MAX_SLOTS = 3;

const CompareCompanies: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const slugs = useMemo(
    () => params.getAll('c').slice(0, MAX_SLOTS),
    [params],
  );
  const [companies, setCompanies] = useState<CompanyCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ slug: string; name: string }>>([]);

  useEffect(() => {
    if (slugs.length === 0) {
      setCompanies([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from('public_company_directory')
        .select('id, slug, name, display_name, industry, size, location, description, founded')
        .in('slug', slugs);

      if (cancelled) return;
      const base = (rows ?? []) as Array<Omit<CompanyCard, 'rating_avg' | 'rating_count' | 'job_count' | 'median_salary'>>;
      const ids = base.map((c) => c.id);

      // Fetch ratings, job counts, and salaries in parallel per company
      const [reviewsRes, jobsRes] = await Promise.all([
        supabase
          .from('company_reviews')
          .select('company_id, rating')
          .in('company_id', ids)
          .eq('status', 'approved')
          .is('deleted_at', null),
        supabase
          .from('jobs')
          .select('company_id, min_salary, max_salary')
          .in('company_id', ids),
      ]);

      if (cancelled) return;

      const ratingsByCompany = new Map<string, number[]>();
      (reviewsRes.data ?? []).forEach((r: { company_id: string; rating: number | null }) => {
        if (r.rating != null) {
          const arr = ratingsByCompany.get(r.company_id) ?? [];
          arr.push(r.rating);
          ratingsByCompany.set(r.company_id, arr);
        }
      });

      const jobsByCompany = new Map<string, Array<{ min: number | null; max: number | null }>>();
      (jobsRes.data ?? []).forEach(
        (j: { company_id: string; min_salary: number | null; max_salary: number | null }) => {
          const arr = jobsByCompany.get(j.company_id) ?? [];
          arr.push({ min: j.min_salary, max: j.max_salary });
          jobsByCompany.set(j.company_id, arr);
        },
      );

      const enriched: CompanyCard[] = base.map((c) => {
        const ratings = ratingsByCompany.get(c.id) ?? [];
        const salaries = jobsByCompany.get(c.id) ?? [];
        const salaryMids = salaries
          .map((s) => (s.min != null && s.max != null ? (s.min + s.max) / 2 : s.min ?? s.max))
          .filter((v): v is number => v != null && v > 0)
          .sort((a, b) => a - b);
        const median =
          salaryMids.length > 0
            ? salaryMids[Math.floor(salaryMids.length / 2)]
            : null;
        return {
          ...c,
          rating_avg: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
          rating_count: ratings.length,
          job_count: salaries.length,
          median_salary: median,
        };
      });

      // Preserve slug order
      const byOrder = slugs
        .map((s) => enriched.find((e) => e.slug === s))
        .filter((c): c is CompanyCard => Boolean(c));
      setCompanies(byOrder);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slugs]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('public_company_directory')
        .select('slug, name, display_name')
        .or(`name.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(8);
      if (!cancelled) {
        setSuggestions(
          (data ?? []).map((r: { slug: string; name: string; display_name: string | null }) => ({
            slug: r.slug,
            name: r.display_name ?? r.name,
          })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  const addSlug = (slug: string) => {
    if (slugs.includes(slug) || slugs.length >= MAX_SLOTS) return;
    const next = new URLSearchParams(params);
    next.append('c', slug);
    setParams(next);
    setQuery('');
    setSuggestions([]);
  };

  const removeSlug = (slug: string) => {
    const next = new URLSearchParams();
    for (const s of slugs) if (s !== slug) next.append('c', s);
    setParams(next);
  };

  const fmtSalary = (n: number | null) =>
    n ? '$' + Math.round(n / 1000) + 'k' : '—';

  const pageUrl = `${ORIGIN}/compare${slugs.length > 0 ? '?' + slugs.map((s) => `c=${s}`).join('&') : ''}`;
  const metaTitle =
    companies.length >= 2
      ? `${companies.map((c) => c.display_name ?? c.name).join(' vs ')} — Compare`
      : 'Compare companies side-by-side';

  return (
    <>
      <Helmet>
        <title>{metaTitle} · HireQuadrant</title>
        <meta
          name="description"
          content="Compare up to 3 companies side-by-side: ratings, open roles, salaries, industry, and location. Powered by real HireQuadrant review data."
        />
        <link rel="canonical" href={pageUrl} />
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbSchema
            className="mb-4"
            items={[
              { name: 'Home', to: '/' },
              { name: 'Companies', to: '/companies' },
              { name: 'Compare' },
            ]}
          />

          <header className="mb-6 flex items-start gap-3">
            <Scale className="h-7 w-7 text-primary-500 mt-1" />
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
                Compare companies
              </h1>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Side-by-side on ratings, open roles, salaries, and culture signals. Pick up to {MAX_SLOTS}.
              </p>
            </div>
          </header>

          {slugs.length < MAX_SLOTS && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 mb-5 relative">
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Add a company
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Start typing a company name..."
                className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 left-4 right-4 mt-1 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((s) => (
                    <li key={s.slug}>
                      <button
                        type="button"
                        onClick={() => addSlug(s.slug)}
                        disabled={slugs.includes(s.slug)}
                        className="w-full text-left px-3 py-2 text-sm text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Plus className="h-3.5 w-3.5 text-primary-500" />
                        {s.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
            </div>
          ) : companies.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <Scale className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Add 2 or 3 companies above to start comparing.
              </p>
              <HardLink
                to="/companies"
                className="inline-block mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Browse all companies →
              </HardLink>
            </div>
          ) : (
            <div className={`grid gap-4 ${companies.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
              {companies.map((c) => (
                <article
                  key={c.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5"
                >
                  <header className="flex items-start justify-between gap-2 mb-4">
                    <div className="min-w-0">
                      <CompanyLogo
                        name={c.display_name ?? c.name}
                        logoUrl={null}
                        size={48}
                        className="mb-2"
                      />
                      <HardLink
                        to={`/companies/${c.slug}`}
                        className="font-bold text-secondary-900 dark:text-white hover:text-primary-600 block truncate"
                      >
                        {c.display_name ?? c.name}
                      </HardLink>
                      {c.industry && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          {c.industry}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSlug(c.slug)}
                      className="p-1 rounded text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </header>

                  <dl className="space-y-2.5 text-sm">
                    <Row
                      icon={<Star className="h-3.5 w-3.5 text-amber-500" />}
                      label="Rating"
                      value={
                        c.rating_count > 0
                          ? `${c.rating_avg.toFixed(1)} / 5 · ${c.rating_count} reviews`
                          : 'No reviews yet'
                      }
                    />
                    <Row
                      icon={<Briefcase className="h-3.5 w-3.5 text-primary-500" />}
                      label="Open roles"
                      value={c.job_count > 0 ? `${c.job_count}` : '0'}
                    />
                    <Row
                      icon={<Users className="h-3.5 w-3.5 text-indigo-500" />}
                      label="Size"
                      value={c.size ?? '—'}
                    />
                    <Row
                      icon={<MapPin className="h-3.5 w-3.5 text-emerald-500" />}
                      label="HQ"
                      value={c.location ?? '—'}
                    />
                    <Row label="Founded" value={c.founded ?? '—'} />
                    <Row
                      label="Median salary"
                      value={fmtSalary(c.median_salary)}
                    />
                  </dl>

                  {c.description && (
                    <p className="mt-4 text-xs text-gray-600 dark:text-slate-400 line-clamp-4">
                      {c.description}
                    </p>
                  )}

                  <HardLink
                    to={`/companies/${c.slug}`}
                    className="mt-4 inline-block text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    See full profile →
                  </HardLink>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const Row: React.FC<{ icon?: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start justify-between gap-2">
    <dt className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
      {icon}
      {label}
    </dt>
    <dd className="text-xs text-secondary-900 dark:text-white font-medium text-right">{value}</dd>
  </div>
);

export default CompareCompanies;
