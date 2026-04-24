import React from 'react';
import { Eye, MessageSquare, Star, Heart, Loader2, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useCompanyAnalytics } from '../../hooks/useCompanyAnalytics';
import { useCompanyAnalyticsTimeseries } from '../../hooks/useCompanyAnalyticsTimeseries';

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

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const CompanyAnalyticsPanel: React.FC<Props> = ({ companyId }) => {
  const { stats, loading, error } = useCompanyAnalytics(companyId);
  const { series, loading: seriesLoading } = useCompanyAnalyticsTimeseries(companyId, 30);

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
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
            Daily page views · last 30 days
          </h3>
          {seriesLoading ? (
            <div className="h-56 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={series} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString()} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
            New followers · last 30 days
          </h3>
          {seriesLoading ? (
            <div className="h-56 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={series} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(l) => new Date(l).toLocaleDateString()} />
                <Bar dataKey="new_followers" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </div>
  );
};

export default CompanyAnalyticsPanel;
