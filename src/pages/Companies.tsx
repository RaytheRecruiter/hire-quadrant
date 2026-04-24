import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import HardLink from '../components/HardLink';
import { Building2, MapPin, Briefcase, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import CompanyLogo from '../components/CompanyLogo';
import RatingStars from '../components/companies/RatingStars';
import { useCompanyDirectory } from '../hooks/useCompanyDirectory';

const PAGE_SIZE = 24;
const ALL = '__all__';

const Companies: React.FC = () => {
  const { companies, loading, error } = useCompanyDirectory();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState<string>(ALL);
  const [page, setPage] = useState(0);

  const industries = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => c.industry && set.add(c.industry));
    return Array.from(set).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (industry !== ALL && c.industry !== industry) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.display_name?.toLowerCase() ?? '').includes(q) ||
        (c.location?.toLowerCase() ?? '').includes(q) ||
        (c.industry?.toLowerCase() ?? '').includes(q)
      );
    });
  }, [companies, search, industry]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const resetPage = () => setPage(0);

  return (
    <>
      <Helmet>
        <title>Browse Companies Hiring — HireQuadrant</title>
        <meta
          name="description"
          content="Discover companies actively hiring. Read reviews, see ratings, and explore open roles across industries."
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-3">Browse Companies</h1>
            <p className="text-lg text-gray-600 dark:text-slate-400">
              {loading
                ? 'Loading…'
                : `Explore ${companies.length} ${companies.length === 1 ? 'company' : 'companies'} on HireQuadrant`}
            </p>
          </header>

          <div className="mb-8 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, industry, or location"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              value={industry}
              onChange={(e) => {
                setIndustry(e.target.value);
                resetPage();
              }}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[200px]"
              aria-label="Filter by industry"
            >
              <option value={ALL}>All industries</option>
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Building2 className="h-10 w-10 text-primary-500 mx-auto animate-pulse" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Unable to Load Companies</h3>
                  <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400">
                {companies.length === 0
                  ? 'No companies listed yet.'
                  : 'No companies match your filters.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visible.map((c) => (
                  <HardLink
                    key={c.id}
                    to={`/companies/${c.slug}`}
                    className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-card hover:shadow-card-hover border border-gray-100 dark:border-slate-700 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <CompanyLogo company={c.name} logoUrl={c.logo ?? undefined} size="lg" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-secondary-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                          {c.display_name || c.name}
                        </h3>
                        {c.industry && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{c.industry}</p>
                        )}
                        {c.location && (
                          <p className="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {c.location}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 rounded-lg px-3 py-1.5">
                        <Briefcase className="h-4 w-4" />
                        {c.job_count} {c.job_count === 1 ? 'role' : 'roles'}
                      </div>
                      {c.review_count > 0 ? (
                        <RatingStars value={c.avg_rating} size="sm" showValue />
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500">No reviews yet</span>
                      )}
                    </div>
                  </HardLink>
                ))}
              </div>

              {pageCount > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-8 flex items-center justify-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-slate-400 px-2">
                    Page {currentPage + 1} of {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={currentPage >= pageCount - 1}
                    className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Companies;
