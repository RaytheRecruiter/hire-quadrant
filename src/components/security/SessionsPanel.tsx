import React, { useCallback, useEffect, useState } from 'react';
import { Monitor, Loader2, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';

interface SessionRow {
  id: string;
  created_at: string;
  updated_at: string;
  not_after: string | null;
  user_agent: string | null;
  ip: string | null;
}

const SessionsPanel: React.FC = () => {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('my_auth_sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error) setRows((data as SessionRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const signOutAll = async () => {
    if (!window.confirm('Sign out of all devices except this one?')) return;
    const { error } = await supabase.auth.signOut({ scope: 'others' });
    if (error) toast.error(error.message);
    else {
      toast.success('Other sessions signed out');
      load();
    }
  };

  const summarize = (ua: string | null) => {
    if (!ua) return 'Unknown device';
    if (/iPhone|iPad|iOS/i.test(ua)) return 'iOS device';
    if (/Android/i.test(ua)) return 'Android device';
    if (/Mac OS X/i.test(ua)) return 'Mac';
    if (/Windows/i.test(ua)) return 'Windows PC';
    if (/Linux/i.test(ua)) return 'Linux';
    return ua.slice(0, 60);
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary-500" />
          <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Active sessions
          </h2>
        </div>
        {rows.length > 1 && (
          <button
            type="button"
            onClick={signOutAll}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700"
          >
            <LogOut className="h-3 w-3" />
            Sign out all others
          </button>
        )}
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : rows.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-slate-400">No other active sessions.</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-slate-700">
          {rows.map((s) => (
            <li key={s.id} className="py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-secondary-900 dark:text-white truncate">
                  {summarize(s.user_agent)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Last active {formatDistanceToNow(new Date(s.updated_at), { addSuffix: true })}
                  {s.ip && ` · ${s.ip}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default SessionsPanel;
