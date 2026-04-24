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

  const openEdit = (r: Experience) => {
    setForm({
      title: r.title,
      company: r.company,
      location: r.location ?? '',
      is_current: r.is_current,
      start_date: r.start_date ?? '',
      end_date: r.end_date ?? '',
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
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim() || null,
      is_current: form.is_current,
      start_date: form.start_date || null,
      end_date: form.is_current ? null : form.end_date || null,
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
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this experience?')) return;
    const { error } = await supabase.from('user_experience').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-gray-400" />
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
        <p className="text-sm text-gray-500">No experience added yet. Click <strong>Add</strong> to create your first entry.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="border-l-2 border-gray-200 pl-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{r.title}</h3>
                  <p className="text-sm text-gray-700">{r.company}{r.location ? ` · ${r.location}` : ''}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {fmtMonth(r.start_date) || '—'} – {r.is_current ? 'Present' : fmtMonth(r.end_date) || '—'}
                  </p>
                  {r.description && (
                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{r.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" aria-label="Edit">
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
  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Job title *"
        className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
      <input
        type="text"
        value={form.company}
        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
        placeholder="Company *"
        className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
      <input
        type="text"
        value={form.location}
        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        placeholder="Location (optional)"
        className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
      />
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.is_current}
          onChange={(e) => setForm((f) => ({ ...f, is_current: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        I currently work here
      </label>
      <div>
        <label className="block text-xs text-gray-500 mb-0.5">Start</label>
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-0.5">End</label>
        <input
          type="date"
          value={form.end_date}
          disabled={form.is_current}
          onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 disabled:bg-gray-100"
        />
      </div>
    </div>
    <textarea
      rows={3}
      maxLength={3000}
      value={form.description}
      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
      placeholder="What did you do? (optional)"
      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
    />
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-white">
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
