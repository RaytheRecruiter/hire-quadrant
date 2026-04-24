import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Trophy, Briefcase, MapPin, Star } from 'lucide-react';
import HardLink from '../components/HardLink';
import CompanyLogo from '../components/CompanyLogo';
import RatingStars from '../components/companies/RatingStars';
import { useCompanyDirectory } from '../hooks/useCompanyDirectory';
import { prettyFromSlug, toSeoSlug } from '../utils/seoSlug';

const SITE_ORIGIN = 'https://hirequadrant.com';

// Curated category buckets — map slug → matchers
const CATEGORY_MATCHERS: Record<
  string,
  { label: string; match: (c: { industry: string | null; size: string | null; location: string | null }) => boolean }
> = {
  'technology': {
    label: 'technology',
    match: (c) => /tech|software|it|engineering|technology/i.test(c.industry ?? ''),
  },
  'healthcare': {
    label: 'healthcare',
    match: (c) => /health|medical|pharma/i.test(c.industry ?? ''),
  },
  'finance': {
    label: 'finance',
    match: (c) => /finance|bank|insurance/i.test(c.industry ?? ''),
  },
  'remote-first': {
    label: 'remote-first',
    match: (c) => /remote/i.test(c.location ?? ''),
  },
  'startups': {
    label: 'startup',
    match: (c) => /1-10|11-50/i.test(c.size ?? ''),
  },
  'enterprise': {
    label: 'enterprise',
    match: (c) => /1001-5000|5000\+/i.test(c.size ?? ''),
  },
};

const BestCompaniesPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { companies, loading } = useCompanyDirectory();

  const meta = categorySlug ? CATEGORY_MATCHERS[categorySlug] : undefined;
  const prettyLabel = meta?.label ?? prettyFromSlug(categorySlug ?? '');

  const ranked = useMemo(() => {
    if (!meta) return [];
    return companies
      .filter((c) => meta.match(c))
      .filter((c) => c.review_count >= 2 || c.job_count > 0)
      .sort((a, b) => {
        // Weight rating more than job count, but a floor of reviews required to rank
        const aScore = (a.review_count >= 2 ? a.avg_rating : 0) * 20 + Math.log1p(a.job_count);
        const bScore = (b.review_count >= 2 ? b.avg_rating : 0) * 20 + Math.log1p(b.job_count);
        return bScore - aScore;
      })
      .slice(0, 25);
  }, [companies, meta]);

  const pageUrl = `${SITE_ORIGIN}/best/${categorySlug}`;
  const metaTitle = `Best ${prettyLabel} companies hiring — HireQuadrant`;
  const metaDesc = `Top ${prettyLabel} companies ranked by employee ratings and open roles on HireQuadrant.`;

  const itemListLd = ranked.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Best ${prettyLabel} companies`,
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-8 flex items-start gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl">
              <Trophy className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-1">
                Best {prettyLabel} companies hiring
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                {loading ? 'Ranking…'
                  : ranked.length === 0 ? `No companies yet in "${prettyLabel}".`
                  : `Ranked by employee rating across ${ranked.length} companies with active hiring on HireQuadrant.`}
              </p>
            </div>
          </header>

          {!meta ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8">
              <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">
                Category not recognized. Try one of:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CATEGORY_MATCHERS).map((k) => (
                  <HardLink key={k} to={`/best/${k}`} className="text-sm px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 hover:bg-primary-200">
                    {CATEGORY_MATCHERS[k].label}
                  </HardLink>
                ))}
              </div>
            </div>
          ) : ranked.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 text-center">
              <p className="text-gray-600 dark:text-slate-400">No {prettyLabel} companies listed yet.</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {ranked.map((c, i) => (
                <li key={c.id}>
                  <HardLink
                    to={`/companies/${c.slug}`}
                    className="group flex items-center gap-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-card-hover transition-all"
                  >
                    <div className="text-2xl font-bold text-gray-300 dark:text-slate-600 w-8 text-right flex-shrink-0">
                      {i + 1}
                    </div>
                    <CompanyLogo company={c.name} logoUrl={c.logo ?? undefined} size="md" />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-secondary-900 dark:text-white truncate group-hover:text-primary-600">
                        {c.display_name || c.name}
                      </h2>
                      <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                        {c.industry && <span>{c.industry}</span>}
                        {c.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {c.review_count > 0 ? <RatingStars value={c.avg_rating} size="sm" showValue /> : <span className="text-xs text-gray-400">No reviews</span>}
                      <span className="inline-flex items-center gap-1 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded-lg">
                        <Briefcase className="h-3.5 w-3.5" />{c.job_count}
                      </span>
                    </div>
                  </HardLink>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </>
  );
};

export default BestCompaniesPage;
