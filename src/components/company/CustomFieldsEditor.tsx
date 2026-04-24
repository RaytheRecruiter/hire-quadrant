import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';

type FieldType = 'short_text' | 'long_text' | 'yes_no' | 'single_choice' | 'multi_choice';

interface Field {
  id?: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  options: string[];
  order_index: number;
}

const NEW_FIELD = (i: number): Field => ({
  label: '',
  field_type: 'short_text',
  required: false,
  options: [],
  order_index: i,
});

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  short_text: 'Short text',
  long_text: 'Long text',
  yes_no: 'Yes / No',
  single_choice: 'Single choice',
  multi_choice: 'Multiple choice',
};

const CustomFieldsEditor: React.FC<{ jobId: string }> = ({ jobId }) => {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('job_custom_fields')
      .select('*')
      .eq('job_id', jobId)
      .order('order_index', { ascending: true });
    setFields(
      (data ?? []).map((d) => ({
        id: d.id,
        label: d.label,
        field_type: d.field_type,
        required: d.required,
        options: Array.isArray(d.options) ? (d.options as string[]) : [],
        order_index: d.order_index,
      })),
    );
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (i: number, patch: Partial<Field>) => {
    setFields((cur) => cur.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };

  const addField = () =>
    setFields((cur) => [...cur, NEW_FIELD(cur.length)]);

  const removeField = async (i: number) => {
    const field = fields[i];
    if (field.id) {
      await supabase.from('job_custom_fields').delete().eq('id', field.id);
    }
    setFields((cur) => cur.filter((_, idx) => idx !== i));
  };

  const saveAll = async () => {
    setSaving(true);
    const payload = fields
      .filter((f) => f.label.trim())
      .map((f, i) => ({
        id: f.id,
        job_id: jobId,
        label: f.label.trim(),
        field_type: f.field_type,
        required: f.required,
        options:
          f.field_type === 'single_choice' || f.field_type === 'multi_choice'
            ? f.options.filter(Boolean)
            : [],
        order_index: i,
      }));
    const { error } = await supabase.from('job_custom_fields').upsert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Custom fields saved');
      load();
    }
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-primary-500 mx-auto my-4" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Custom application fields
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Collect extra answers from applicants beyond resume + cover letter.
          </p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add field
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500 italic py-4">
          No custom fields yet. Candidates will only submit the default resume + cover letter.
        </p>
      ) : (
        <ul className="space-y-3">
          {fields.map((f, i) => (
            <li
              key={f.id ?? `new-${i}`}
              className="bg-gray-50 dark:bg-slate-900/40 rounded-lg border border-gray-100 dark:border-slate-700 p-3"
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-gray-300 dark:text-slate-600 mt-2 flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) => update(i, { label: e.target.value })}
                      placeholder="Question label"
                      className="flex-1 text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <select
                      value={f.field_type}
                      onChange={(e) => update(i, { field_type: e.target.value as FieldType })}
                      className="text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {Object.entries(FIELD_TYPE_LABELS).map(([v, label]) => (
                        <option key={v} value={v}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(f.field_type === 'single_choice' || f.field_type === 'multi_choice') && (
                    <input
                      type="text"
                      value={f.options.join(', ')}
                      onChange={(e) =>
                        update(i, {
                          options: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                      placeholder="Comma-separated choices"
                      className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                    />
                  )}

                  <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => update(i, { required: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Required
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => removeField(i)}
                  className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {fields.length > 0 && (
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-1 px-4 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save fields
          </button>
        </div>
      )}
    </div>
  );
};

export default CustomFieldsEditor;
