import React from 'react';
import { GraduationCap, Flame, ThumbsUp, AlertCircle, Loader2 } from 'lucide-react';
import { useCareerPaths } from '../hooks/useCareerPaths';
import { useNavigate } from 'react-router-dom';

interface CareerGrowthPathsProps {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
}

export const CareerGrowthPaths: React.FC<CareerGrowthPathsProps> = ({
  jobTitle,
  jobDescription,
}) => {
  const { paths, loading, error } = useCareerPaths(jobTitle, jobDescription);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="mt-8 p-6 bg-blue-50/50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading career paths...</span>
        </div>
      </div>
    );
  }

  if (!paths || paths.length === 0) {
    return null;
  }

  const getMatchIcon = (label: 'high' | 'medium' | 'low') => {
    switch (label) {
      case 'high':
        return <Flame className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getMatchLabel = (label: 'high' | 'medium' | 'low') => {
    switch (label) {
      case 'high':
        return 'High Match';
      case 'medium':
        return 'Medium Match';
      case 'low':
        return 'Low Match';
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3 mb-2">
        <GraduationCap className="h-6 w-6 text-primary-600" />
        <div>
          <h3 className="text-2xl font-bold text-secondary-900 dark:text-white">Career Growth Paths</h3>
          <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Where this role can take you next</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 italic">
        AI-generated estimates, not based on Nexegin platform data or verified outcomes. Use as a
        starting point for your own research, not as a guarantee.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {paths.slice(0, 3).map((path, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-secondary-900 dark:text-white text-lg">{path.role}</h4>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-sm font-medium text-gray-700 dark:text-slate-300">
                {getMatchIcon(path.match_label)}
                <span>{getMatchLabel(path.match_label)}</span>
              </div>
            </div>

            {/* Missing Skills */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">You'll Need to Learn</p>
              <div className="flex flex-wrap gap-2">
                {path.missing_skills.slice(0, 3).map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate(`/career?from=${encodeURIComponent(path.role)}`)}
              className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              View full path →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
