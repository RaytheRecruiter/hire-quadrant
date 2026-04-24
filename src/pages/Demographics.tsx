import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

const GENDER = ['Woman', 'Man', 'Non-binary', 'Prefer to self-describe', 'Prefer not to say'];
const RACES = [
  'American Indian or Alaska Native',
  'Asian',
  'Black or African American',
  'Hispanic or Latino',
  'Native Hawaiian or Other Pacific Islander',
  'White',
  'Two or more races',
  'Prefer not to say',
];
const VETERAN = [
  'I am not a veteran',
  'I am a veteran',
  'I am a protected veteran',
  'Prefer not to say',
];
const DISABILITY = [
  'Yes, I have a disability (or previously had a disability)',
  'No, I do not have a disability',
  'Prefer not to say',
];

interface FormState {
  gender: string;
  race: string[];
  veteran_status: string;
  disability_status: string;
}

const empty: FormState = { gender: '', race: [], veteran_status: '', disability_status: '' };

const Demographics: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('user_demographics')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setForm({
          gender: data.gender ?? '',
          race: Array.isArray(data.race) ? data.race : [],
          veteran_status: data.veteran_status ?? '',
          disability_status: data.disability_status ?? '',
        });
      }
      setLoading(false);
    })();
  }, [user?.id]);

  if (authLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login?returnTo=/demographics" replace />;

  const toggleRace = (r: string) => {
    setForm((f) => ({
      ...f,
      race: f.race.includes(r) ? f.race.filter((x) => x !== r) : [...f.race, r],
    }));
  };

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('user_demographics').upsert(
      {
        user_id: user.id,
        gender: form.gender || null,
        race: form.race,
        veteran_status: form.veteran_status || null,
        disability_status: form.disability_status || null,
      },
      { onConflict: 'user_id' },
    );
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Demographics saved');
  };

  return (
    <>
      <Helmet><title>My Demographics · HireQuadrant</title></Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">My Demographics</h1>
            <p className="text-gray-600 dark:text-slate-400 mt-1">
              Optional, self-reported information used for EEO reporting and to help us track equal-opportunity outcomes.
            </p>
          </header>

          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary-900 dark:text-primary-200">
              Your responses are private. Employers never see individual answers — only aggregated, anonymized statistics.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 space-y-6">
              <section>
                <label htmlFor="demographics-gender" className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                  Gender
                </label>
                <select
                  id="demographics-gender"
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">—</option>
                  {GENDER.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </section>

              <section>
                <span className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                  Race / Ethnicity (select all that apply)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RACES.map((r) => (
                    <label key={r} className="flex items-center gap-2 text-sm text-secondary-900 dark:text-white">
                      <input
                        type="checkbox"
                        checked={form.race.includes(r)}
                        onChange={() => toggleRace(r)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <label htmlFor="demographics-veteran" className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                  Veteran status
                </label>
                <select
                  id="demographics-veteran"
                  value={form.veteran_status}
                  onChange={(e) => setForm((f) => ({ ...f, veteran_status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">—</option>
                  {VETERAN.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </section>

              <section>
                <label htmlFor="demographics-disability" className="block text-sm font-medium text-secondary-900 dark:text-white mb-2">
                  Disability status
                </label>
                <select
                  id="demographics-disability"
                  value={form.disability_status}
                  onChange={(e) => setForm((f) => ({ ...f, disability_status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">—</option>
                  {DISABILITY.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </section>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Demographics;
