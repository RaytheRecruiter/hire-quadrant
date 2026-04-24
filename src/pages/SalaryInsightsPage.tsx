import React from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { DollarSign, MapPin, AlertCircle } from 'lucide-react';
import HardLink from '../components/HardLink';
import { useSalaryInsights } from '../hooks/useSalaryInsights';
import { prettyFromSlug } from '../utils/seoSlug';

const SITE_ORIGIN = 'https://hirequadrant.com';
const fmt = (n: number) => '$' + Math.round(n / 1000) + 'k';

const SalaryInsightsPage: React.FC = () => {
  const { titleSlug } = useParams<{ titleSlug: string }>();
  const titleLike = prettyFromSlug(titleSlug ?? '');
  const { insight, loading } = useSalaryInsights(titleLike);

  const pageUrl = `${SITE_ORIGIN}/salaries/${titleSlug}`;
  const metaTitle = insight
    ? `${titleLike} salary: ${fmt(insight.median)} median — HireQuadrant`
    : `${titleLike} salary data — HireQuadrant`;
  const metaDesc = insight
    ? `Median ${titleLike} salary is ${fmt(insight.median)} (25th %: ${fmt(insight.p25)}, 75th %: ${fmt(insight.p75)}) based on ${insight.count} open roles on HireQuadrant.`
    : `Explore salary ranges for ${titleLike} roles on HireQuadrant.`;

  const occupationLd = insight
    ? {
        '@context': 'https://schema.org',
        '@type': 'Occupation',
        name: titleLike,
        estimatedSalary: {
          '@type': 'MonetaryAmountDistribution',
          name: 'base',
          currency: 'USD',
          duration: 'P1Y',
          median: insight.median,
          percentile25: insight.p25,
          percentile75: insight.p75,
          minValue: insight.min,
          maxValue: insight.max,
        },
      }
    : null;

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={pageUrl} />
        {occupationLd && <script type="application/ld+json">{JSON.stringify(occupationLd)}</script>}
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-gray-500 dark:text-slate-400">
            <HardLink to="/" className="hover:text-primary-600">Jobs</HardLink>
            <span className="mx-2">/</span>
            <span>Salaries</span>
            <span className="mx-2">/</span>
            <span className="text-secondary-900 dark:text-white">{titleLike}</span>
          </nav>

          <header className="mb-8 flex items-start gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl">
              <DollarSign className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-1">
                {titleLike} salary
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                {loading ? 'Crunching data…'
                  : insight ? `${insight.count} open roles analyzed on HireQuadrant`
                  : `Not enough salary data for ${titleLike} yet.`}
              </p>
            </div>
          </header>

          {loading ? (
            <div className="animate-pulse h-32 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700" />
          ) : !insight ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700 dark:text-slate-300 mb-3">
                  We don't have enough salary samples for this title yet. Try a broader role — or browse open roles below.
                </p>
                <HardLink to="/" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Browse all jobs →
                </HardLink>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard label="25th percentile" value={fmt(insight.p25)} accent="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300" />
                <StatCard label="Median" value={fmt(insight.median)} accent="bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 ring-1 ring-primary-300" />
                <StatCard label="75th percentile" value={fmt(insight.p75)} accent="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300" />
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
                <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">Range</h2>
                <div className="relative h-2 rounded-full bg-gray-200 dark:bg-slate-700">
                  <div
                    className="absolute top-0 h-2 rounded-full bg-gradient-to-r from-amber-400 via-primary-400 to-emerald-400"
                    style={{
                      left: `${((insight.p25 - insight.min) / Math.max(1, insight.max - insight.min)) * 100}%`,
                      width: `${((insight.p75 - insight.p25) / Math.max(1, insight.max - insight.min)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-2">
                  <span>{fmt(insight.min)}</span>
                  <span>{fmt(insight.max)}</span>
                </div>
              </div>

              {insight.top_locations.length > 0 && (
                <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
                  <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
                    Top locations hiring
                  </h2>
                  <ul className="space-y-2">
                    {insight.top_locations.map((l) => (
                      <li key={l.location} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300">
                          <MapPin className="h-3.5 w-3.5 text-gray-400" />
                          {l.location}
                        </span>
                        <span className="text-gray-500 dark:text-slate-400">
                          {l.count} {l.count === 1 ? 'role' : 'roles'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
                  Titles included in this estimate
                </h2>
                <div className="flex flex-wrap gap-2">
                  {insight.sample_titles.map((t) => (
                    <span key={t} className="px-2.5 py-1 text-xs rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
                <HardLink to="/" className="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Browse open {titleLike} roles →
                </HardLink>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const StatCard: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
  <div className={`rounded-2xl p-4 text-center ${accent}`}>
    <div className="text-xs uppercase tracking-wide opacity-80">{label}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
  </div>
);

export default SalaryInsightsPage;
