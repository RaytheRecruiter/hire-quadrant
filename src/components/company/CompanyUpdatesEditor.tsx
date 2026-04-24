import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Megaphone, Pin, PinOff, Edit2, Trash2, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyUpdates, type CompanyUpdate } from '../../hooks/useCompanyUpdates';

interface Props {
  companyId: string;
}

const emptyForm = { title: '', body: '', pinned: false };

const CompanyUpdatesEditor: React.FC<Props> = ({ companyId }) => {
  const { user } = useAuth();
  const { updates, loading, refresh } = useCompanyUpdates(companyId);
  const [editing, setEditing] = useState<CompanyUpdate | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setCreating(true);
  };
  const openEdit = (u: CompanyUpdate) => {
    setForm({ title: u.title, body: u.body, pinned: u.pinned });
    setEditing(u);
    setCreating(false);
  };
  const closeForm = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
  };

  const save = async () => {
    if (!user?.id) return;
    if (form.title.trim().length < 3) {
      toast.error('Title is too short');
      return;
    }
    if (form.body.trim().length < 5) {
      toast.error('Body is too short');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('company_updates')
          .update({
            title: form.title.trim(),
            body: form.body.trim(),
            pinned: form.pinned,
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Update saved');
      } else {
        const { error } = await supabase.from('company_updates').insert({
          company_id: companyId,
          author_id: user.id,
          title: form.title.trim(),
          body: form.body.trim(),
          pinned: form.pinned,
        });
        if (error) throw error;
        toast.success('Update published');
      }
      closeForm();
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const togglePin = async (u: CompanyUpdate) => {
    setBusyId(u.id);
    const { error } = await supabase
      .from('company_updates')
      .update({ pinned: !u.pinned })
      .eq('id', u.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  };

  const remove = async (u: CompanyUpdate) => {
    if (!window.confirm(`Delete "${u.title}"?`)) return;
    setBusyId(u.id);
    const { error } = await supabase.from('company_updates').delete().eq('id', u.id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Deleted');
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Company Updates
          </h3>
        </div>
        {!creating && !editing && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            New update
          </button>
        )}
      </div>

      {(creating || editing) && (
        <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <input
            type="text"
            maxLength={120}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Headline (e.g. 'Raised Series B')"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <textarea
            rows={4}
            maxLength={2000}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="What's new?"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <label className="flex items-center gap-2 text-sm text-secondary-900 dark:text-white">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
            />
            Pin to top of feed
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save changes' : 'Publish'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : updates.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400 py-8 text-center">
          No updates yet. Publish announcements here — they'll appear on your public profile and (soon) in followers' feeds.
        </p>
      ) : (
        <div className="space-y-3">
          {updates.map((u) => (
            <article
              key={u.id}
              className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-secondary-900 dark:text-white">{u.title}</h4>
                    {u.pinned && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(u.published_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line">
                    {u.body}
                  </p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePin(u)}
                    disabled={busyId === u.id}
                    title={u.pinned ? 'Unpin' : 'Pin'}
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400"
                  >
                    {u.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(u)}
                    title="Edit"
                    className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(u)}
                    disabled={busyId === u.id}
                    title="Delete"
                    className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyUpdatesEditor;
