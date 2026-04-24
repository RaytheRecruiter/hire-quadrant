import React from 'react';
import { Eye, MessageSquare, Star, Heart, Loader2, AlertCircle } from 'lucide-react';
import { useCompanyAnalytics } from '../../hooks/useCompanyAnalytics';

interface Props {
  companyId: string;
}

const Stat: React.FC<{
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = ({ label, value, icon: Icon, accent }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2.5 rounded-lg ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <div className="text-3xl font-bold text-secondary-900 dark:text-white">{value}</div>
    <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">{label}</div>
  </div>
);

const CompanyAnalyticsPanel: React.FC<Props> = ({ companyId }) => {
  const { stats, loading, error } = useCompanyAnalytics(companyId);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 text-primary-500 animate-spin mx-auto" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">
            {error ?? 'Unable to load analytics'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat
        label="Page views · last 30 days"
        value={stats.total_views_30d.toLocaleString()}
        icon={Eye}
        accent="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
      />
      <Stat
        label="Approved reviews"
        value={stats.review_count}
        icon={MessageSquare}
        accent="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
      />
      <Stat
        label="Average rating"
        value={stats.review_count > 0 ? Number(stats.avg_rating).toFixed(1) : '—'}
        icon={Star}
        accent="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
      />
      <Stat
        label="Followers"
        value={stats.follower_count.toLocaleString()}
        icon={Heart}
        accent="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"
      />
    </div>
  );
};

export default CompanyAnalyticsPanel;
