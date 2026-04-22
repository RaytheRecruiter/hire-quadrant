import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { useCareerPaths } from '../hooks/useCareerPaths';

interface Props {
  jobTitle: string;
  jobDescription?: string;
}

const CareerGrowthPaths: React.FC<Props> = ({ jobTitle, jobDescription }) => {
  const { paths, loading } = useCareerPaths(jobTitle);

  if (loading) {
    return (
      <div className="mt-12 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-slate-900/20 rounded-3xl shadow-lg border border-amber-100/20 dark:border-amber-900/20 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  if (paths.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-900/20 dark:to-slate-900/20 rounded-3xl shadow-lg border border-amber-100/20 dark:border-amber-900/20 p-8">
      <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2 flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-amber-500" />
        Career Growth Paths
      </h3>
      <p className="text-secondary-600 dark:text-slate-400 mb-6">
        Where this role can take you next
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paths.slice(0, 4).map((path, index) => (
          <div
            key={index}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-100 dark:border-amber-900/30 hover:border-amber-200 dark:hover:border-amber-700 p-5 transition-all hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-secondary-900 dark:text-white mb-1">
                  {path.role}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    path.match_label === 'high'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : path.match_label === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {path.match_label === 'high' && '🔥 High Match'}
                    {path.match_label === 'medium' && '👍 Medium Match'}
                    {path.match_label === 'low' && '⚠️ Low Match'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-secondary-600 dark:text-slate-400">
                    Skill Transfer
                  </span>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    {path.skill_transfer_pct}%
                  </span>
                </div>
                <div className="w-full h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700"
                    style={{ width: `${path.skill_transfer_pct}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                <div className="text-sm text-secondary-700 dark:text-slate-300 mb-2">
                  <span className="font-semibold">Salary increase:</span>{' '}
                  <span className="text-green-600 dark:text-green-400 font-bold">
                    +${(path.salary_delta_low / 1000).toFixed(0)}K–${(path.salary_delta_high / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="text-sm text-secondary-700 dark:text-slate-300 mb-3">
                  <span className="font-semibold">Time to transition:</span> {path.time_to_transition}
                </div>
              </div>

              {path.missing_skills.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-secondary-600 dark:text-slate-400 mb-2">
                    Missing skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {path.missing_skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center">
        <Link
          to={`/career?from=${encodeURIComponent(jobTitle)}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold transition-colors"
        >
          View full career path
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default CareerGrowthPaths;
