import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Building2, AlertCircle, Briefcase, MapPin } from 'lucide-react';
import HardLink from '../components/HardLink';
import CompanyLogo from '../components/CompanyLogo';
import RatingStars from '../components/companies/RatingStars';
import { useCompanyDirectory } from '../hooks/useCompanyDirectory';
import { prettyFromSlug, toSeoSlug } from '../utils/seoSlug';

const SITE_ORIGIN = 'https://hirequadrant.com';

const IndustryPage: React.FC = () => {
  const { industrySlug } = useParams<{ industrySlug: string }>();
  const { companies, loading, error } = useCompanyDirectory();

  const pretty = prettyFromSlug(industrySlug ?? '');
  const filtered = useMemo(
    () => companies.filter((c) => toSeoSlug(c.industry) === industrySlug),
    [companies, industrySlug],
  );

  const topRated = useMemo(
    () =>
      filtered
        .filter((c) => c.review_count > 0)
        .sort((a, b) => b.avg_rating - a.avg_rating)
        .slice(0, 5),
    [filtered],
  );

  const ranked = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
        return b.job_count - a.job_count;
      }),
    [filtered],
  );

  const pageUrl = `${SITE_ORIGIN}/companies/industry/${industrySlug}`;
  const metaTitle = `Top ${pretty} Companies Hiring — HireQuadrant`;
  const metaDesc = `${filtered.length > 0 ? `Browse ${filtered.length} ${pretty.toLowerCase()} companies` : `${pretty} companies`} on HireQuadrant. See ratings, open roles, and reviews from current and former employees.`;

  const itemListLd = ranked.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${pretty} Companies`,
    itemListElement: ranked.slice(0, 20).map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_ORIGIN}/companies/${c.slug}`,
      name: c.display_name || c.name,
    })),
  } : null;

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={pageUrl} />
        {itemListLd && <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>}
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            <HardLink to="/companies" className="hover:text-primary-600">Companies</HardLink>
            <span className="mx-2">/</span>
            <span className="text-secondary-900 dark:text-white">{pretty}</span>
          </nav>

          <header className="mb-8">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-3">
              {pretty} Companies
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-400">
              {loading
                ? 'Loading…'
                : `${filtered.length} ${filtered.length === 1 ? 'company' : 'companies'} in ${pretty}`}
            </p>
          </header>

          {loading ? (
            <div className="text-center py-16">
              <Building2 className="h-10 w-10 text-primary-500 mx-auto animate-pulse" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-slate-400">
                No companies listed in {pretty} yet.
              </p>
              <HardLink to="/companies" className="text-primary-600 hover:text-primary-700 font-medium mt-3 inline-block">
                Browse all industries →
              </HardLink>
            </div>
          ) : (
            <>
              {topRated.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
                    Top rated in {pretty}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {topRated.map((c, i) => (
                      <HardLink
                        key={c.id}
                        to={`/companies/${c.slug}`}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-card-hover transition-all"
                      >
                        <div className="text-xs font-semibold text-primary-600 mb-2">#{i + 1}</div>
                        <div className="font-semibold text-secondary-900 dark:text-white mb-1 truncate">
                          {c.display_name || c.name}
                        </div>
                        <RatingStars value={c.avg_rating} size="sm" showValue />
                      </HardLink>
                    ))}
                  </div>
                </section>
              )}

              <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-4">
                All {pretty} companies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {ranked.map((c) => (
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
                        <span className="text-xs text-gray-400 dark:text-slate-500">No reviews</span>
                      )}
                    </div>
                  </HardLink>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default IndustryPage;
