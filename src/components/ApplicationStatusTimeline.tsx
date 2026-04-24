import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { CheckCircle2, Eye, Phone, Users, Award, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HistoryRow {
  id: string;
  from_status: string | null;
  to_status: string;
  created_at: string;
  note: string | null;
}

const STATUS_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  Applied: { icon: CheckCircle2, tone: 'text-primary-600 bg-primary-100' },
  Viewed: { icon: Eye, tone: 'text-blue-600 bg-blue-100' },
  Screening: { icon: Phone, tone: 'text-amber-600 bg-amber-100' },
  Interview: { icon: Users, tone: 'text-indigo-600 bg-indigo-100' },
  Offer: { icon: Award, tone: 'text-emerald-600 bg-emerald-100' },
  Rejected: { icon: XCircle, tone: 'text-rose-600 bg-rose-100' },
};

const ApplicationStatusTimeline: React.FC<{ applicationId: string }> = ({ applicationId }) => {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('application_status_history')
        .select('id, from_status, to_status, created_at, note')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });
      if (!cancelled) {
        setRows(data ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applicationId]);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs text-gray-500 dark:text-slate-400">
        No status history yet.
      </p>
    );
  }

  return (
    <ol className="space-y-2.5">
      {rows.map((r) => {
        const { icon: Icon, tone } = STATUS_STYLE[r.to_status] ?? STATUS_STYLE.Applied;
        return (
          <li key={r.id} className="flex gap-3">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full grid place-items-center ${tone}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-secondary-900 dark:text-white">
                {r.to_status}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </p>
              {r.note && (
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5 italic">{r.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default ApplicationStatusTimeline;
