import React, { useCallback, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { Search, Bell, Trash2, Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import HardLink from '../components/HardLink';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface SavedSearchRow {
  id: string;
  name: string;
  query: { q?: string; loc?: string };
  alert_frequency: 'off' | 'daily' | 'weekly';
  last_run_at: string | null;
  created_at: string;
}

const SavedSearches: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [rows, setRows] = useState<SavedSearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [frequency, setFrequency] = useState<'off' | 'daily' | 'weekly'>('daily');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setRows((data as SavedSearchRow[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!user?.id || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('saved_searches').insert({
      user_id: user.id,
      name: name.trim(),
      query: { q: q.trim(), loc: loc.trim() },
      alert_frequency: frequency,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Saved search created');
    setName('');
    setQ('');
    setLoc('');
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((cur) => cur.filter((r) => r.id !== id));
  };

  const updateFrequency = async (id: string, freq: 'off' | 'daily' | 'weekly') => {
    const { error } = await supabase
      .from('saved_searches')
      .update({ alert_frequency: freq })
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, alert_frequency: freq } : r)));
  };

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/saved-searches" replace />;

  return (
    <>
      <Helmet>
        <title>Saved searches · HireQuadrant</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary-500" />
            <div>
              <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">
                Saved searches
              </h1>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Get notified when new jobs match your criteria.
              </p>
            </div>
          </header>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 mb-5">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3 flex items-center gap-1.5">
              <Plus className="h-4 w-4 text-primary-500" />
              Create a saved search
            </h2>
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name — e.g. Remote senior dev roles"
                className="text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Keyword"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <input
                  type="text"
                  value={loc}
                  onChange={(e) => setLoc(e.target.value)}
                  placeholder="Location"
                  className="text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'off' | 'daily' | 'weekly')}
                  className="text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="off">No alerts</option>
                  <option value="daily">Daily alerts</option>
                  <option value="weekly">Weekly alerts</option>
                </select>
                <button
                  type="button"
                  onClick={create}
                  disabled={saving || !name.trim()}
                  className="inline-flex items-center gap-1 px-4 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
            <h2 className="text-sm font-semibold text-secondary-900 dark:text-white mb-3">
              Your saved searches
            </h2>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : rows.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-400 italic">
                No saved searches yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-slate-700">
                {rows.map((r) => {
                  const hasQ = Boolean(r.query?.q);
                  const hasLoc = Boolean(r.query?.loc);
                  return (
                    <li key={r.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <HardLink
                          to={`/jobs?${new URLSearchParams({ q: r.query?.q ?? '', loc: r.query?.loc ?? '' }).toString()}`}
                          className="block hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded -mx-2 px-2 py-1"
                        >
                          <p className="text-sm font-medium text-secondary-900 dark:text-white">
                            {r.name}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400">
                            {hasQ && `"${r.query.q}"`}
                            {hasQ && hasLoc && ' · '}
                            {hasLoc && r.query.loc}
                            {!hasQ && !hasLoc && 'All jobs'}
                            {r.last_run_at && (
                              <span className="ml-2">
                                · last run{' '}
                                {formatDistanceToNow(new Date(r.last_run_at), { addSuffix: true })}
                              </span>
                            )}
                          </p>
                        </HardLink>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <select
                          value={r.alert_frequency}
                          onChange={(e) =>
                            updateFrequency(r.id, e.target.value as 'off' | 'daily' | 'weekly')
                          }
                          className="text-xs rounded border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="off">Off</option>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => remove(r.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default SavedSearches;
