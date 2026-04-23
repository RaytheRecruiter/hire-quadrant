import React from 'react';
import { Sparkles, MapPin, DollarSign } from 'lucide-react';
import { useRelatedJobBuckets } from '../hooks/useRelatedJobBuckets';
import RelatedJobsSection from './RelatedJobsSection';

interface Props {
  jobId: string;
  currentLocation?: string;
  currentMinSalary?: number | null;
  currentMaxSalary?: number | null;
}

/**
 * Renders the three related-job buckets — 🔥 Similar Jobs,
 * 📍 Jobs Near You, 💰 Jobs With Higher Pay — fed by a single
 * find_similar_jobs RPC call partitioned client-side.
 */
const RelatedJobs: React.FC<Props> = ({
  jobId,
  currentLocation,
  currentMinSalary,
  currentMaxSalary,
}) => {
  const { similar, nearYou, higherPay, loading } = useRelatedJobBuckets(jobId, {
    currentLocation,
    currentMinSalary,
    currentMaxSalary,
  });

  if (loading) return null;

  return (
    <div>
      <RelatedJobsSection
        title="Similar Jobs You Might Like"
        icon={<Sparkles className="h-5 w-5 text-primary-500" />}
        jobs={similar}
        emphasis="similarity"
      />
      <RelatedJobsSection
        title="Jobs Near You"
        icon={<MapPin className="h-5 w-5 text-primary-500" />}
        jobs={nearYou}
        emphasis="location"
      />
      <RelatedJobsSection
        title="Jobs With Higher Pay"
        icon={<DollarSign className="h-5 w-5 text-primary-500" />}
        jobs={higherPay}
        emphasis="salary"
      />
    </div>
  );
};

export default RelatedJobs;
