import React, { useEffect, useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { supabase } from '../../utils/supabaseClient';
import { TrendingUp, Users, Eye, Target } from 'lucide-react';

interface DailyStats {
  date: string;
  applications: number;
  views: number;
}

interface FunnelStage {
  stage: string;
  count: number;
}

const DashboardCharts: React.FC = () => {
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [funnel, setFunnel] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const dayKey = (d: Date) => d.toISOString().slice(0, 10);

      // Build a map of dates for the last 30 days
      const dayMap: Record<string, DailyStats> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        dayMap[dayKey(d)] = { date: dayKey(d).slice(5), applications: 0, views: 0 };
      }

      // Fetch applications over 30 days
      const { data: apps } = await supabase
        .from('job_applications')
        .select('applied_at, status')
        .gte('applied_at', thirtyDaysAgo.toISOString());
      (apps || []).forEach((a: any) => {
        const k = dayKey(new Date(a.applied_at));
        if (dayMap[k]) dayMap[k].applications += 1;
      });

      setDaily(Object.values(dayMap));

      // Build funnel: total views → applications → reviewed → interview → offer/hired
      const { data: allJobs } = await supabase.from('jobs').select('views');
      const totalViews = (allJobs || []).reduce((s: number, j: any) => s + (j.views || 0), 0);

      const { data: allApps } = await supabase.from('job_applications').select('status');
      const total = (allApps || []).length;
      const reviewed = (allApps || []).filter((a: any) => ['reviewing', 'Screening', 'reviewed', 'Interview', 'Offer', 'Rejected', 'interview', 'offered', 'hired'].includes(a.status)).length;
      const interviewed = (allApps || []).filter((a: any) => ['Interview', 'interview', 'Offer', 'offered', 'hired'].includes(a.status)).length;
      const offered = (allApps || []).filter((a: any) => ['Offer', 'offered', 'hired'].includes(a.status)).length;

      setFunnel([
        { stage: 'Job views', count: totalViews },
        { stage: 'Applications', count: total },
        { stage: 'Reviewed', count: reviewed },
        { stage: 'Interview', count: interviewed },
        { stage: 'Offer / Hired', count: offered },
      ]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const totalApps30 = daily.reduce((s, d) => s + d.applications, 0);
  const peakDay = daily.reduce((max, d) => d.applications > max.applications ? d : max, daily[0] || { date: '', applications: 0, views: 0 });
  const conversion = funnel[0]?.count > 0 ? ((funnel[1]?.count / funnel[0]?.count) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications trend */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-secondary-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-500" />
                Applications — last 30 days
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {totalApps30} total · peak {peakDay?.applications || 0} on {peakDay?.date || '—'}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="appsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a9960" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#4a9960" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                labelStyle={{ color: '#1a3a2a', fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="applications" stroke="#4a9960" strokeWidth={2} fill="url(#appsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-lg font-bold text-secondary-900 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary-500" />
                Hiring funnel
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {conversion}% view → application rate
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={funnel} layout="vertical" margin={{ top: 5, right: 15, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                labelStyle={{ color: '#1a3a2a', fontWeight: 600 }}
              />
              <Bar dataKey="count" fill="#4a9960" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
