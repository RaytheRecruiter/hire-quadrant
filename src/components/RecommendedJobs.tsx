import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, MapPin, Building2, Clock, Loader2, X } from 'lucide-react';
import { useRecommendedJobs } from '../hooks/useRecommendedJobs';
import { useSkippedJobs } from '../hooks/useSkippedJobs';
import { generateSlug } from '../utils/slugGenerator';

const RecommendedJobs: React.FC = () => {
  const { recommended, loading } = useRecommendedJobs(6);
  const { skipJob } = useSkippedJobs();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (recommended.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-gradient-to-br from-primary-50 to-primary-50/50 dark:from-primary-900/20 dark:to-slate-900/20 rounded-3xl shadow-lg border border-primary-100/20 dark:border-primary-900/20 p-8">
      <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-6 flex items-center gap-2">
        <Lightbulb className="h-6 w-6 text-primary-500" />
        Recommended For You
      </h3>
      <p className="text-secondary-600 dark:text-slate-400 mb-6">
        Based on jobs you've saved, we found {recommended.length} roles that match your interests
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommended.map(job => (
          <div
            key={job.id}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-card-hover transition-all"
          >
            <Link
              to={`/job/${generateSlug(job.title, job.company)}`}
              className="block p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors line-clamp-2">
                    {job.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-medium mt-0.5">
                    {job.company}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold">
                    {Math.min(job.matchScore, 99)}%
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </span>
                )}
                {job.type && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {job.type}
                  </span>
                )}
              </div>
            </Link>

            {/* "Not Interested" dismiss button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                skipJob(job.id);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors opacity-0 group-hover:opacity-100"
              title="Not interested in this job"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedJobs;
