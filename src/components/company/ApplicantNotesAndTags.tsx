import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Tag, X, Plus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface NoteRow {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  author_name?: string | null;
}

interface TagRow {
  id: string;
  tag: string;
  author_id: string;
}

const ApplicantNotesAndTags: React.FC<{ applicationId: string }> = ({ applicationId }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [n, t] = await Promise.all([
      supabase
        .from('applicant_notes')
        .select('id, body, author_id, created_at')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('applicant_tags')
        .select('id, tag, author_id')
        .eq('application_id', applicationId),
    ]);
    setNotes((n.data as NoteRow[]) ?? []);
    setTags((t.data as TagRow[]) ?? []);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  const addNote = async () => {
    const body = noteBody.trim();
    if (!body || !user?.id) return;
    setBusy(true);
    const { error } = await supabase
      .from('applicant_notes')
      .insert({ application_id: applicationId, author_id: user.id, body });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNoteBody('');
    load();
  };

  const removeNote = async (id: string) => {
    const { error } = await supabase.from('applicant_notes').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNotes((cur) => cur.filter((n) => n.id !== id));
  };

  const addTag = async () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || !user?.id) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('applicant_tags')
      .insert({ application_id: applicationId, author_id: user.id, tag })
      .select()
      .single();
    setBusy(false);
    if (error) {
      toast.error(error.code === '23505' ? 'Tag already exists' : error.message);
      return;
    }
    setTags((cur) => [...cur, data as TagRow]);
    setNewTag('');
  };

  const removeTag = async (id: string) => {
    const { error } = await supabase.from('applicant_tags').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTags((cur) => cur.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-4">
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Tag className="h-4 w-4 text-primary-500" />
          <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">Tags</h4>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full"
            >
              {t.tag}
              <button type="button" onClick={() => removeTag(t.id)} title="Remove">
                <X className="h-3 w-3 hover:text-primary-900" />
              </button>
            </span>
          ))}
          {tags.length === 0 && (
            <span className="text-xs text-gray-400 dark:text-slate-500">No tags yet.</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag (e.g. top-choice)"
            maxLength={40}
            className="flex-1 text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={busy || !newTag.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-primary-500" />
          <h4 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Private notes
          </h4>
        </div>
        <textarea
          value={noteBody}
          onChange={(e) => setNoteBody(e.target.value)}
          placeholder="Private note about this applicant (only your team can see this)"
          rows={2}
          maxLength={2000}
          className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500 mb-2"
        />
        <button
          type="button"
          onClick={addNote}
          disabled={busy || !noteBody.trim()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 mb-3"
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Add note
        </button>

        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : notes.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-slate-500">No notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li
                key={n.id}
                className="bg-gray-50 dark:bg-slate-900/40 rounded-lg border border-gray-100 dark:border-slate-700 p-2.5 text-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-secondary-900 dark:text-white whitespace-pre-wrap min-w-0 flex-1">
                    {n.body}
                  </p>
                  {n.author_id === user?.id && (
                    <button
                      type="button"
                      onClick={() => removeNote(n.id)}
                      title="Remove"
                      className="text-rose-500 hover:text-rose-700 flex-shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
                  {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ApplicantNotesAndTags;
