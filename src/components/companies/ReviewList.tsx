import React from 'react';
import ReviewCard from './ReviewCard';
import type { CompanyReview } from '../../hooks/useCompanyReviews';

interface Props {
  reviews: CompanyReview[];
  companyName?: string;
  companySlug?: string;
  emptyLabel?: string;
}

const ReviewList: React.FC<Props> = ({ reviews, companyName, companySlug, emptyLabel }) => {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-slate-400">
        {emptyLabel ?? 'No reviews yet. Be the first to share your experience.'}
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} companyName={companyName} companySlug={companySlug} />
      ))}
    </div>
  );
};

export default ReviewList;
