import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Briefcase, Plus, Edit2, Trash2, Loader2, Check, X } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  is_current: boolean;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

const empty = {
  title: '',
  company: '',
  location: '',
  is_current: false,
  start_date: '',
  end_date: '',
  description: '',
};

const fmtMonth = (d: string | null) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
};

const ExperienceSection: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // 'new' | uuid | null
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_experience')
      .select('*')
      .eq('user_id', user.id)
      .order('is_current', { ascending: false })
      .order('start_date', { ascending: false });
    setRows((data as Experience[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(empty);
    setEditing('new');
  };

  // <input type="month"> only accepts YYYY-MM; legacy rows saved as
  // YYYY-MM-DD need to be trimmed before populating the form.
  const toMonthInput = (d: string | null): string => {
    if (!d) return '';
    return d.length >= 7 ? d.slice(0, 7) : d;
  };

  const openEdit = (r: Experience) => {
    setForm({
      title: r.title,
      company: r.company,
      location: r.location ?? '',
      is_current: r.is_current,
      start_date: toMonthInput(r.start_date),
      end_date: toMonthInput(r.end_date),
      description: r.description ?? '',
    });
    setEditing(r.id);
  };

  const save = async () => {
    if (!user?.id) return;
    if (!form.title.trim() || !form.company.trim()) {
      toast.error('Title and company are required');
      return;
    }
    setSaving(true);
    // Inputs are <input type="month"> which produce YYYY-MM. Normalize to
    // YYYY-MM-01 so the date column accepts the value. Existing rows
    // saved as full dates still load correctly because fmtMonth() and the
    // <input type="month"> happily accept YYYY-MM-DD trimmed to YYYY-MM.
    const normalizeMonth = (v: string): string | null => {
      if (!v) return null;
      // Already a full YYYY-MM-DD (e.g. legacy data) — pass through.
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
      // YYYY-MM from the month picker — anchor to the 1st of the month.
      if (/^\d{4}-\d{2}$/.test(v)) return `${v}-01`;
      return null;
    };
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim() || null,
      is_current: form.is_current,
      start_date: normalizeMonth(form.start_date),
      end_date: form.is_current ? null : normalizeMonth(form.end_date),
      description: form.description.trim() || null,
    };
    const { error } =
      editing === 'new'
        ? await supabase.from('user_experience').insert(payload)
        : await supabase.from('user_experience').update(payload).eq('id', editing!);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing === 'new' ? 'Experience added' : 'Experience saved');
    setEditing(null);
    load();
    // Refreshes the profile completeness bar at the top of /profile.
    window.dispatchEvent(new CustomEvent('profile-updated'));
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this experience?')) return;
    const { error } = await supabase.from('user_experience').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
    window.dispatchEvent(new CustomEvent('profile-updated'));
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-gray-400 dark:text-slate-500" />
          Work Experience
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </div>

      {editing && (
        <ExperienceForm
          form={form}
          setForm={setForm}
          onCancel={() => setEditing(null)}
          onSave={save}
          saving={saving}
          isEdit={editing !== 'new'}
        />
      )}

      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : rows.length === 0 && !editing ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">No experience added yet. Click <strong>Add</strong> to create your first entry.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="border-l-2 border-gray-200 dark:border-slate-700 pl-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{r.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-slate-300">{r.company}{r.location ? ` · ${r.location}` : ''}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    {fmtMonth(r.start_date) || '—'} – {r.is_current ? 'Present' : fmtMonth(r.end_date) || '—'}
                  </p>
                  {r.description && (
                    <p className="text-sm text-gray-700 dark:text-slate-300 mt-2 whitespace-pre-line">{r.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700 text-gray-500 dark:text-slate-400" aria-label="Edit">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-600" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

interface FormProps {
  form: typeof empty;
  setForm: React.Dispatch<React.SetStateAction<typeof empty>>;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  isEdit: boolean;
}

const ExperienceForm: React.FC<FormProps> = ({ form, setForm, onCancel, onSave, saving, isEdit }) => (
  <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 mb-4 space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Job title *"
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
      <input
        type="text"
        value={form.company}
        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
        placeholder="Company *"
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
      <input
        type="text"
        value={form.location}
        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        placeholder="Location (optional)"
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={form.is_current}
          onChange={(e) => setForm((f) => ({ ...f, is_current: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
        />
        I currently work here
      </label>
      <div>
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-0.5">Start</label>
        <input
          type="month"
          value={form.start_date}
          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 dark:text-slate-400 mb-0.5">End</label>
        <input
          type="month"
          value={form.end_date}
          disabled={form.is_current}
          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 disabled:bg-gray-100 dark:bg-slate-700"
        />
      </div>
    </div>
    <textarea
      rows={3}
      maxLength={3000}
      value={form.description}
      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      placeholder="What did you do? (optional)"
      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
    />
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-white dark:bg-slate-800">
        <X className="h-4 w-4" /> Cancel
      </button>
      <button type="button" onClick={onSave} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {isEdit ? 'Save' : 'Add'}
      </button>
    </div>
  </div>
);

export default ExperienceSection;
