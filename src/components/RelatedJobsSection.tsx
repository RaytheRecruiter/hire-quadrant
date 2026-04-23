import React from 'react';
import RelatedJobCard, { RelatedJob } from './RelatedJobCard';

interface Props {
  title: string;
  icon: React.ReactNode;
  jobs: RelatedJob[];
  emptyWhenEmpty?: boolean; // if true, render nothing instead of an empty state
  emphasis?: 'similarity' | 'location' | 'salary';
}

/**
 * Shared shell for "Similar Jobs", "Jobs Near You", "Jobs With Higher Pay"
 * so they stay visually consistent and one fix lands everywhere.
 */
const RelatedJobsSection: React.FC<Props> = ({
  title,
  icon,
  jobs,
  emptyWhenEmpty = true,
  emphasis = 'similarity',
}) => {
  if (jobs.length < 2) {
    // Avoid showing a section with a single sliver of a job
    return emptyWhenEmpty ? null : null;
  }
  return (
    <div className="mt-8 bg-white/90 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 dark:border-slate-700/20 p-6">
      <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-3">
        {jobs.map((j) => (
          <RelatedJobCard key={j.id} job={j} emphasis={emphasis} />
        ))}
      </div>
    </div>
  );
};

export default RelatedJobsSection;
