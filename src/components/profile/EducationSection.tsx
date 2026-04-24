import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { GraduationCap, Plus, Edit2, Trash2, Loader2, Check, X } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Education {
  id: string;
  school: string;
  degree: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
}

const empty = { school: '', degree: '', field_of_study: '', start_year: '', end_year: '', description: '' };

const EducationSection: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('user_education')
      .select('*')
      .eq('user_id', user.id)
      .order('end_year', { ascending: false, nullsFirst: true })
      .order('start_year', { ascending: false });
    setRows((data as Education[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(empty);
    setEditing('new');
  };

  const openEdit = (r: Education) => {
    setForm({
      school: r.school,
      degree: r.degree ?? '',
      field_of_study: r.field_of_study ?? '',
      start_year: r.start_year?.toString() ?? '',
      end_year: r.end_year?.toString() ?? '',
      description: r.description ?? '',
    });
    setEditing(r.id);
  };

  const save = async () => {
    if (!user?.id) return;
    if (!form.school.trim()) {
      toast.error('School is required');
      return;
    }
    setSaving(true);
    const payload = {
      user_id: user.id,
      school: form.school.trim(),
      degree: form.degree.trim() || null,
      field_of_study: form.field_of_study.trim() || null,
      start_year: form.start_year ? Number(form.start_year) : null,
      end_year: form.end_year ? Number(form.end_year) : null,
      description: form.description.trim() || null,
    };
    const { error } =
      editing === 'new'
        ? await supabase.from('user_education').insert(payload)
        : await supabase.from('user_education').update(payload).eq('id', editing!);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editing === 'new' ? 'Education added' : 'Education saved');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this entry?')) return;
    const { error } = await supabase.from('user_education').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gray-400" />
          Education
        </h2>
        {!editing && (
          <button type="button" onClick={openNew} className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
            <Plus className="h-4 w-4" /> Add
          </button>
        )}
      </div>

      {editing && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <input
            type="text"
            value={form.school}
            onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
            placeholder="School *"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.degree}
              onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))}
              placeholder="Degree (e.g. B.S.)"
              className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            <input
              type="text"
              value={form.field_of_study}
              onChange={(e) => setForm((f) => ({ ...f, field_of_study: e.target.value }))}
              placeholder="Field of study"
              className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            <input
              type="number"
              min="1950"
              max="2100"
              value={form.start_year}
              onChange={(e) => setForm((f) => ({ ...f, start_year: e.target.value }))}
              placeholder="Start year"
              className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
            <input
              type="number"
              min="1950"
              max="2100"
              value={form.end_year}
              onChange={(e) => setForm((f) => ({ ...f, end_year: e.target.value }))}
              placeholder="End year (blank = in progress)"
              className="px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>
          <textarea
            rows={2}
            maxLength={1000}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-white">
              <X className="h-4 w-4" /> Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editing === 'new' ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-6">
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : rows.length === 0 && !editing ? (
        <p className="text-sm text-gray-500">No education added yet.</p>
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className="border-l-2 border-gray-200 pl-4 group">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{r.school}</h3>
                  {(r.degree || r.field_of_study) && (
                    <p className="text-sm text-gray-700">
                      {[r.degree, r.field_of_study].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {(r.start_year || r.end_year) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.start_year ?? '—'} – {r.end_year ?? 'Present'}
                    </p>
                  )}
                  {r.description && (
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{r.description}</p>
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

export default EducationSection;
