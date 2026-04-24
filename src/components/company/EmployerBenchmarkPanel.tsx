import React, { useEffect, useState } from 'react';
import { BarChart3, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface Benchmarks {
  industry: string | null;
  my: {
    rating: number;
    review_count: number;
    job_count: number;
    application_count: number;
  };
  peer_median: {
    rating: number;
    review_count: number;
    job_count: number;
    application_count: number;
  };
}

const EmployerBenchmarkPanel: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [data, setData] = useState<Benchmarks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: rpc, error: rpcErr } = await supabase.rpc('employer_benchmarks', {
        p_company_id: companyId,
      });
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr.message);
        setLoading(false);
        return;
      }
      setData(rpc as Benchmarks);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500 mx-auto" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-10 text-center text-sm text-gray-500 dark:text-slate-400">
        {error ?? 'Benchmarks unavailable.'}
      </div>
    );
  }

  const rows: Array<{ key: keyof Benchmarks['my']; label: string; format: (n: number) => string }> = [
    { key: 'rating', label: 'Average rating', format: (n) => (n > 0 ? `${Number(n).toFixed(1)} / 5` : 'No reviews') },
    { key: 'review_count', label: 'Total reviews', format: (n) => String(Math.round(Number(n))) },
    { key: 'job_count', label: 'Open roles', format: (n) => String(Math.round(Number(n))) },
    { key: 'application_count', label: 'Applications received', format: (n) => String(Math.round(Number(n))) },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-5 w-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
          Benchmarks
        </h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
        {data.industry
          ? `How you compare to other ${data.industry} companies on HireQuadrant.`
          : 'Peer industry is not set — add an industry in Company Profile to unlock richer benchmarks.'}
      </p>

      <div className="space-y-4">
        {rows.map((r) => {
          const mine = Number(data.my[r.key] ?? 0);
          const peer = Number(data.peer_median[r.key] ?? 0);
          const delta = peer > 0 ? ((mine - peer) / peer) * 100 : 0;
          const trend = delta > 5 ? 'up' : delta < -5 ? 'down' : 'flat';
          const max = Math.max(mine, peer, 1);
          const myPct = Math.min(100, (mine / max) * 100);
          const peerPct = Math.min(100, (peer / max) * 100);
          return (
            <section
              key={r.key}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-secondary-900 dark:text-white">
                  {r.label}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    trend === 'up'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : trend === 'down'
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : trend === 'down' ? <TrendingDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  {peer > 0
                    ? `${delta >= 0 ? '+' : ''}${delta.toFixed(0)}% vs peers`
                    : 'No peer data'}
                </span>
              </div>

              <div className="space-y-2">
                <Bar label="You" value={r.format(mine)} pct={myPct} tone="bg-primary-500" />
                <Bar label="Peer median" value={r.format(peer)} pct={peerPct} tone="bg-gray-300 dark:bg-slate-600" />
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-gray-500 dark:text-slate-400 italic">
        Peer median is calculated across all companies in your industry on HireQuadrant. A 0 peer value means there isn't enough data yet — the benchmark fills in as more companies join.
      </p>
    </div>
  );
};

const Bar: React.FC<{ label: string; value: string; pct: number; tone: string }> = ({
  label,
  value,
  pct,
  tone,
}) => (
  <div>
    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400 mb-1">
      <span>{label}</span>
      <span className="font-mono font-semibold text-secondary-900 dark:text-white">{value}</span>
    </div>
    <div className="h-2 rounded-full bg-gray-100 dark:bg-slate-900 overflow-hidden">
      <div
        className={`h-full ${tone} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  </div>
);

export default EmployerBenchmarkPanel;
