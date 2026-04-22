import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Building2 } from 'lucide-react';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useAuth } from '../contexts/AuthContext';
import { generateSlug } from '../utils/slugGenerator';

interface Props {
  excludeJobId?: string;
}

const RecentlyViewedJobs: React.FC<Props> = ({ excludeJobId }) => {
  const { user } = useAuth();
  const { recentJobs } = useRecentlyViewed(excludeJobId);

  // Only show for authenticated users with at least 2 recent jobs
  if (!user || recentJobs.length < 2) return null;

  return (
    <div className="mt-8 bg-white/90 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 dark:border-slate-700/20 p-6">
      <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-slate-400" />
        Jobs You Recently Viewed
      </h3>
      <div className="space-y-3">
        {recentJobs.map(job => (
          <Link
            key={job.id}
            to={`/job/${generateSlug(job.title, job.company)}`}
            className="block p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-secondary-900 dark:text-white truncate">{job.title}</h4>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {job.company || 'Company'}
                  </span>
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </span>
                  )}
                </div>
              </div>
              {(job as any).salary && (
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0">
                  {(job as any).salary}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewedJobs;
