import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import RatingStars from './RatingStars';
import type { CompanyReview } from '../../hooks/useCompanyReviews';

interface Props {
  review: CompanyReview;
  companyName?: string;
}

const DIMENSIONS: Array<{ key: keyof CompanyReview; label: string }> = [
  { key: 'rating_work_life', label: 'Work-Life Balance' },
  { key: 'rating_compensation', label: 'Compensation' },
  { key: 'rating_management', label: 'Management' },
  { key: 'rating_culture', label: 'Culture' },
  { key: 'rating_career_growth', label: 'Career Growth' },
];

const ReviewCard: React.FC<Props> = ({ review, companyName }) => {
  const authorLine = review.is_anonymous
    ? 'Anonymous employee'
    : `Reviewed by an employee`;
  const statusLabel = review.employment_status
    ? review.employment_status === 'current'
      ? 'Current employee'
      : 'Former employee'
    : null;

  return (
    <article className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            {review.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {authorLine}
            {review.job_title ? ` · ${review.job_title}` : ''}
            {statusLabel ? ` · ${statusLabel}` : ''}
            {` · ${formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}`}
          </p>
        </div>
        <div className="flex-shrink-0">
          <RatingStars value={review.rating_overall} size="md" showValue />
        </div>
      </header>

      {/* Dimension ratings */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4 text-xs">
        {DIMENSIONS.map(({ key, label }) => {
          const val = (review[key] as number | null) ?? 0;
          if (!val) return null;
          return (
            <div key={key} className="bg-gray-50 dark:bg-slate-900/50 rounded-lg px-2 py-1.5">
              <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-slate-500 mb-0.5">
                {label}
              </div>
              <RatingStars value={val} size="sm" />
            </div>
          );
        })}
      </div>

      {review.pros && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">
            <ThumbsUp className="h-4 w-4" />
            Pros
          </div>
          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">{review.pros}</p>
        </div>
      )}

      {review.cons && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-rose-700 dark:text-rose-400 mb-1">
            <ThumbsDown className="h-4 w-4" />
            Cons
          </div>
          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">{review.cons}</p>
        </div>
      )}

      {review.response && (
        <aside className="mt-4 border-l-2 border-primary-400 pl-4 py-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Response from {companyName ?? 'the employer'} ·{' '}
            {formatDistanceToNow(new Date(review.response.created_at), { addSuffix: true })}
          </div>
          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">
            {review.response.body}
          </p>
        </aside>
      )}
    </article>
  );
};

export default ReviewCard;
