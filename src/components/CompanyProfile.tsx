import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Globe,
  Mail,
  Building2,
  Award,
  Heart,
  Briefcase,
  Star,
} from 'lucide-react';
import { useJobs } from '../contexts/JobContext';
import { useBulkJobMatchScores } from '../hooks/useBulkJobMatchScores';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useCompanyReviews } from '../hooks/useCompanyReviews';
import RatingStars from './companies/RatingStars';
import ReviewForm from './companies/ReviewForm';
import ReviewList from './companies/ReviewList';
import FollowButton from './companies/FollowButton';
import ClaimBanner from './companies/ClaimBanner';
import CompanyUpdatesFeed from './companies/CompanyUpdatesFeed';
import JobCard from './JobCard';
import { buildAggregateRatingLd, buildOrganizationLd } from '../utils/structuredData';

const SITE_ORIGIN = 'https://hirequadrant.com';

const CompanyProfile: React.FC = () => {
  // Route declares :id — treat the value as slug-or-id (hook resolves both)
  const { id: slugOrId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company, loading, error } = useCompanyProfile(slugOrId);
  const { jobs } = useJobs();

  const companyJobs = useMemo(() => {
    if (!company) return [];
    return jobs.filter((job) => {
      if ((job as any).company_id && (job as any).company_id === company.id) return true;
      return (
        job.company === company.name ||
        job.company === company.display_name ||
        job.sourceCompany === company.name ||
        job.sourceCompany === company.display_name
      );
    });
  }, [jobs, company]);

  const companyJobIds = useMemo(() => companyJobs.map((j) => j.id), [companyJobs]);
  useBulkJobMatchScores(companyJobIds);

  const { approved: approvedReviews, own: ownReview, refresh: refreshReviews } = useCompanyReviews(
    company?.id,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <Building2 className="h-10 w-10 text-primary-500 animate-pulse" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Company Not Found</h2>
          {error && <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{error}</p>}
          <button
            onClick={() => navigate('/companies')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Back to Companies
          </button>
        </div>
      </div>
    );
  }

  const pageUrl = `${SITE_ORIGIN}/companies/${company.slug}`;
  const socials = company.socials ?? {};
  const sameAs = Object.values(socials).filter((v): v is string => typeof v === 'string' && v.length > 0);
  const orgLd = buildOrganizationLd({
    name: company.display_name || company.name,
    url: pageUrl,
    logo: company.logo ?? undefined,
    description: company.description ?? undefined,
    sameAs,
  });
  const aggLd = buildAggregateRatingLd({
    itemName: company.display_name || company.name,
    ratingValue: company.avg_rating,
    reviewCount: company.review_count,
  });

  const metaTitle = `${company.display_name || company.name} — Jobs, Reviews & Ratings | HireQuadrant`;
  const metaDesc =
    company.description?.slice(0, 155) ||
    `See open roles, company info, and employee reviews for ${company.display_name || company.name} on HireQuadrant.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={pageUrl} />
        <script type="application/ld+json">{JSON.stringify(orgLd)}</script>
        {aggLd && <script type="application/ld+json">{JSON.stringify(aggLd)}</script>}
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate('/companies')}
          className="flex items-center text-primary-600 hover:text-primary-700 mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Companies
        </button>

        {!company.claimed_at && (
          <div className="mb-6">
            <ClaimBanner
              companySlug={company.slug}
              companyName={company.display_name || company.name}
              emailDomain={company.email_domain}
            />
          </div>
        )}

        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden mb-8">
          <div
            className="h-40 bg-gradient-to-r from-primary-400 to-primary-600 bg-cover bg-center"
            style={company.header_image_url ? { backgroundImage: `url(${company.header_image_url})` } : undefined}
          />
          <div className="px-8 pb-8 relative">
            <div className="absolute -top-14 left-8 w-28 h-28 bg-white rounded-2xl shadow-md border-4 border-white dark:border-slate-800 overflow-hidden">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={`${company.display_name} logo`}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Building2 className="h-14 w-14 text-primary-600 dark:text-primary-400" />
                </div>
              )}
            </div>

            <div className="pt-20 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white">
                  {company.display_name || company.name}
                </h1>
                {company.industry && (
                  <p className="text-lg text-gray-600 dark:text-slate-400 mt-1">{company.industry}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-slate-400 mt-4">
                  {company.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {company.location}
                    </span>
                  )}
                  {company.size && (
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {company.size} employees
                    </span>
                  )}
                  {company.founded && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Founded {company.founded}
                    </span>
                  )}
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-stretch gap-3 text-center">
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3 min-w-[110px]">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {company.job_count}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">Open roles</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 min-w-[130px]">
                  <div className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {company.review_count > 0 ? company.avg_rating.toFixed(1) : '—'}
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">
                    {company.review_count} {company.review_count === 1 ? 'review' : 'reviews'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
              {company.review_count > 0 ? (
                <RatingStars value={company.avg_rating} size="md" />
              ) : (
                <span />
              )}
              <FollowButton companyId={company.id} companySlug={company.slug} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CompanyUpdatesFeed companyId={company.id} />
            {company.description && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">
                  About {company.display_name || company.name}
                </h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {company.description}
                </p>
              </section>
            )}

            {company.culture && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-5 w-5 text-primary-600" />
                  <h2 className="text-xl font-bold text-secondary-900 dark:text-white">Our Culture</h2>
                </div>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {company.culture}
                </p>
              </section>
            )}

            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white">Employee Reviews</h2>
                {company.review_count > 0 && (
                  <div className="flex items-center gap-2">
                    <RatingStars value={company.avg_rating} size="md" />
                    <span className="text-sm text-gray-600 dark:text-slate-400">
                      {company.avg_rating.toFixed(1)} · {company.review_count}{' '}
                      {company.review_count === 1 ? 'review' : 'reviews'}
                    </span>
                  </div>
                )}
              </div>

              <ReviewForm
                companyId={company.id}
                companySlug={company.slug}
                existing={ownReview}
                onSaved={refreshReviews}
              />

              <ReviewList
                reviews={approvedReviews}
                companyName={company.display_name || company.name}
                companySlug={company.slug}
              />
            </section>

            <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-primary-600" />
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white">
                  Open Positions ({companyJobs.length})
                </h2>
              </div>
              {companyJobs.length > 0 ? (
                <div className="space-y-4">
                  {companyJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  No open roles at the moment. Check back soon.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            {Array.isArray(company.specialties) && company.specialties.length > 0 && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-secondary-900 dark:text-white">Specialties</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {company.specialties.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 rounded-full text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {Array.isArray(company.benefits) && company.benefits.length > 0 && (
              <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Benefits & Perks</h3>
                <ul className="space-y-1.5 text-sm text-gray-700 dark:text-slate-300">
                  {company.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary-400">•</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
