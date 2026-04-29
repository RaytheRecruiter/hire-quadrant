import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Target, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Prefs {
  desired_titles: string[];
  desired_locations: string[];
  zip_code: string;
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  work_types: string[];
  schedules: string[];
  workplace_types: string[];
  open_to_relocation: boolean;
  work_authorization: string;
  ready_to_interview: boolean;
}

const WORK_TYPES = ['Full-time', 'Part-time', 'Contract', 'Contract-to-hire', 'Internship', 'Temporary'];
const SCHEDULES = ['Day shift', 'Evening shift', 'Night shift', 'Weekends', 'On call', 'Overtime'];
const WORKPLACE = ['Remote', 'Hybrid', 'On-site'];
const AUTH_OPTIONS = [
  'Authorized to work in the US',
  'Need H-1B sponsorship',
  'Need other visa sponsorship',
  'Prefer not to say',
];

const empty: Prefs = {
  desired_titles: [],
  desired_locations: [],
  zip_code: '',
  desired_salary_min: null,
  desired_salary_max: null,
  work_types: [],
  schedules: [],
  workplace_types: [],
  open_to_relocation: false,
  work_authorization: '',
  ready_to_interview: false,
};

const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

const JobPreferencesSection: React.FC = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(empty);
  const [titlesInput, setTitlesInput] = useState('');
  const [locationsInput, setLocationsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from('user_job_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setPrefs({
          desired_titles: data.desired_titles ?? [],
          desired_locations: data.desired_locations ?? [],
          zip_code: data.zip_code ?? '',
          desired_salary_min: data.desired_salary_min,
          desired_salary_max: data.desired_salary_max,
          work_types: data.work_types ?? [],
          schedules: data.schedules ?? [],
          workplace_types: data.workplace_types ?? [],
          open_to_relocation: data.open_to_relocation ?? false,
          work_authorization: data.work_authorization ?? '',
          ready_to_interview: data.ready_to_interview ?? false,
        });
        setTitlesInput((data.desired_titles ?? []).join(', '));
        setLocationsInput((data.desired_locations ?? []).join(', '));
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const toggle = (key: 'work_types' | 'schedules' | 'workplace_types', value: string) => {
    setPrefs((p) => ({
      ...p,
      [key]: p[key].includes(value) ? p[key].filter((v) => v !== value) : [...p[key], value],
    }));
  };

  const save = async () => {
    if (!user?.id) return;
    // Per Scott 2026-04-28: zip code is now mandatory.
    const zip = prefs.zip_code.trim();
    if (!zip) {
      toast.error('ZIP code is required.');
      return;
    }
    if (!ZIP_REGEX.test(zip)) {
      toast.error('Enter a valid US ZIP code (5 digits or 5+4).');
      return;
    }
    setSaving(true);
    const titles = titlesInput.split(',').map((s) => s.trim()).filter(Boolean);
    const locations = locationsInput.split(',').map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from('user_job_preferences').upsert(
      {
        user_id: user.id,
        desired_titles: titles,
        desired_locations: locations,
        zip_code: zip,
        desired_salary_min: prefs.desired_salary_min,
        desired_salary_max: prefs.desired_salary_max,
        work_types: prefs.work_types,
        schedules: prefs.schedules,
        workplace_types: prefs.workplace_types,
        open_to_relocation: prefs.open_to_relocation,
        work_authorization: prefs.work_authorization || null,
        ready_to_interview: prefs.ready_to_interview,
      },
      { onConflict: 'user_id' },
    );
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Preferences saved');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6 text-center py-10">
        <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-gray-400 dark:text-slate-500" />
        Job Preferences
      </h2>

      <div className="space-y-5">
        <div>
          <label htmlFor="pref-titles" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Desired job titles</label>
          <input
            id="pref-titles"
            type="text"
            value={titlesInput}
            onChange={(e) => setTitlesInput(e.target.value)}
            placeholder="Comma-separated (e.g. Software Engineer, Product Manager)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
          />
        </div>

        <div>
          <label htmlFor="pref-zip" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            ZIP code <span className="text-red-500">*</span>
          </label>
          <input
            id="pref-zip"
            name="zip_code"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            required
            maxLength={10}
            pattern="\d{5}(-\d{4})?"
            value={prefs.zip_code}
            onChange={(e) => setPrefs((p) => ({ ...p, zip_code: e.target.value }))}
            placeholder="e.g. 22030"
            className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
          />
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Used for distance-based job matching.
          </p>
        </div>

        <div>
          <label htmlFor="pref-locations" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Desired locations</label>
          <input
            id="pref-locations"
            type="text"
            value={locationsInput}
            onChange={(e) => setLocationsInput(e.target.value)}
            placeholder="Comma-separated (e.g. Remote, New York, Austin)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pref-salary-min" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Salary min ($)</label>
            <input
              id="pref-salary-min"
              type="number"
              value={prefs.desired_salary_min ?? ''}
              onChange={(e) => setPrefs((p) => ({ ...p, desired_salary_min: e.target.value ? Number(e.target.value) : null }))}
              placeholder="e.g. 80000"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
            />
          </div>
          <div>
            <label htmlFor="pref-salary-max" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Salary max ($)</label>
            <input
              id="pref-salary-max"
              type="number"
              value={prefs.desired_salary_max ?? ''}
              onChange={(e) => setPrefs((p) => ({ ...p, desired_salary_max: e.target.value ? Number(e.target.value) : null }))}
              placeholder="e.g. 140000"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
            />
          </div>
        </div>

        <ChipGroup label="Work types" options={WORK_TYPES} selected={prefs.work_types} onToggle={(v) => toggle('work_types', v)} />
        <ChipGroup label="Schedules" options={SCHEDULES} selected={prefs.schedules} onToggle={(v) => toggle('schedules', v)} />
        <ChipGroup label="Workplace" options={WORKPLACE} selected={prefs.workplace_types} onToggle={(v) => toggle('workplace_types', v)} />

        <div>
          <label htmlFor="pref-auth" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Work authorization</label>
          <select
            id="pref-auth"
            value={prefs.work_authorization}
            onChange={(e) => setPrefs((p) => ({ ...p, work_authorization: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 text-sm"
          >
            <option value="">—</option>
            {AUTH_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={prefs.open_to_relocation}
              onChange={(e) => setPrefs((p) => ({ ...p, open_to_relocation: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
            />
            Open to relocation
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={prefs.ready_to_interview}
              onChange={(e) => setPrefs((p) => ({ ...p, ready_to_interview: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
            />
            Ready to interview (signals employers you're actively looking)
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
};

const ChipGroup: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}> = ({ label, options, selected, onToggle }) => (
  <div>
    <span className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{label}</span>
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              active
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200'
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  </div>
);

export default JobPreferencesSection;
