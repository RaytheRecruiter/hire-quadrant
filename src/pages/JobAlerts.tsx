import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, Plus, Trash2, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface SavedSearch {
  id: string;
  name: string;
  search_term: string | null;
  location_filter: string | null;
  type_filter: string | null;
  min_salary: number | null;
  email_frequency: 'daily' | 'weekly' | 'never';
  last_sent_at: string | null;
  created_at: string;
}

const JobAlerts: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<SavedSearch>>({
    name: '',
    search_term: '',
    location_filter: '',
    type_filter: '',
    min_salary: 0,
    email_frequency: 'daily',
  });
  const [saving, setSaving] = useState(false);

  const fetchSearches = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSearches(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSearches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const handleSave = async () => {
    if (!form.name) return toast.error('Alert name is required.');
    setSaving(true);
    const { error } = await supabase.from('saved_searches').insert({
      user_id: user.id,
      name: form.name,
      search_term: form.search_term || null,
      location_filter: form.location_filter || null,
      type_filter: form.type_filter || null,
      min_salary: form.min_salary || null,
      email_frequency: form.email_frequency || 'daily',
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setForm({ name: '', search_term: '', location_filter: '', type_filter: '', min_salary: 0, email_frequency: 'daily' });
    fetchSearches();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this alert?')) return;
    await supabase.from('saved_searches').delete().eq('id', id);
    fetchSearches();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white flex items-center gap-3">
            <Bell className="h-7 w-7 text-primary-500" />
            Job Alerts
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Get emailed when new jobs match your criteria.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 dark:border-slate-700 p-6 mb-8">
          <h3 className="font-bold text-secondary-800 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create New Alert
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Alert name (e.g. Remote Senior React Jobs)"
              value={form.name || ''}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="md:col-span-2 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
            />
            <input
              type="text"
              placeholder="Keywords"
              value={form.search_term || ''}
              onChange={e => setForm(f => ({ ...f, search_term: e.target.value }))}
              className="border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
            />
            <input
              type="text"
              placeholder="Location"
              value={form.location_filter || ''}
              onChange={e => setForm(f => ({ ...f, location_filter: e.target.value }))}
              className="border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
            />
            <select
              value={form.type_filter || ''}
              onChange={e => setForm(f => ({ ...f, type_filter: e.target.value }))}
              className="border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              <option value="">Any type</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
            <select
              value={form.email_frequency || 'daily'}
              onChange={e => setForm(f => ({ ...f, email_frequency: e.target.value as any }))}
              className="border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
            >
              <option value="daily">Daily emails</option>
              <option value="weekly">Weekly emails</option>
              <option value="never">No emails (just save)</option>
            </select>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 shadow-md"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Create Alert
          </button>
        </div>

        {loading ? (
          <div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" /></div>
        ) : searches.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg border border-white/20 dark:border-slate-700 p-12 text-center">
            <div className="bg-gray-100 dark:bg-slate-700 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10 text-gray-400 dark:text-slate-500" />
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">No alerts yet</h3>
            <p className="text-gray-600 dark:text-slate-400">Create your first job alert above to get notified when new opportunities match your criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-800 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-slate-700 p-5 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-secondary-900 dark:text-white">{s.name}</h4>
                  <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                    {[s.search_term && `"${s.search_term}"`, s.location_filter, s.type_filter, s.min_salary && `$${s.min_salary / 1000}k+`].filter(Boolean).join(' • ') || 'All jobs'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                    {s.email_frequency === 'never' ? 'No emails' : `Emailed ${s.email_frequency}`}
                    {s.last_sent_at && ` — last sent ${new Date(s.last_sent_at).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobAlerts;
