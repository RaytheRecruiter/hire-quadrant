import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, Loader2, Save, X, Sparkles } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

interface Block {
  id: string;
  company_id: string;
  kind: 'text' | 'image' | 'video' | 'quote' | 'stat';
  heading: string | null;
  body: string | null;
  image_url: string | null;
  video_url: string | null;
  position: number;
}

interface Props {
  companyId: string;
}

type Draft = Omit<Block, 'id' | 'company_id' | 'position'>;

const emptyDraft: Draft = {
  kind: 'text',
  heading: '',
  body: '',
  image_url: '',
  video_url: '',
};

const KIND_HINTS: Record<Draft['kind'], string> = {
  text: 'Paragraph with optional heading — great for culture, mission, process.',
  image: 'An image URL — team photo, office, events. Use a Storage bucket or hosted CDN.',
  video: 'YouTube / Vimeo share URL — we auto-embed. Direct .mp4 URLs also work.',
  quote: 'Pull-quote from a leader or employee. Heading = attribution (e.g. "Jane, CEO").',
  stat: 'Standout number — "95% retention", "50% remote". Body = the number, heading = the label.',
};

const WhyJoinUsPanel: React.FC<Props> = ({ companyId }) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_content_blocks')
      .select('*')
      .eq('company_id', companyId)
      .order('position', { ascending: true });
    setBlocks((data as Block[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing('new'); setDraft(emptyDraft); };
  const openEdit = (b: Block) => {
    setEditing(b.id);
    setDraft({
      kind: b.kind,
      heading: b.heading ?? '',
      body: b.body ?? '',
      image_url: b.image_url ?? '',
      video_url: b.video_url ?? '',
    });
  };
  const close = () => { setEditing(null); setDraft(emptyDraft); };

  const save = async () => {
    setSaving(true);
    const payload = {
      company_id: companyId,
      kind: draft.kind,
      heading: draft.heading?.trim() || null,
      body: draft.body?.trim() || null,
      image_url: draft.image_url?.trim() || null,
      video_url: draft.video_url?.trim() || null,
    };
    let err;
    if (editing === 'new') {
      const nextPos = blocks.length ? Math.max(...blocks.map((b) => b.position)) + 1 : 0;
      ({ error: err } = await supabase.from('company_content_blocks').insert({ ...payload, position: nextPos }));
    } else {
      ({ error: err } = await supabase.from('company_content_blocks').update(payload).eq('id', editing!));
    }
    setSaving(false);
    if (err) return toast.error(err.message);
    toast.success(editing === 'new' ? 'Block added' : 'Block saved');
    close();
    load();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this block?')) return;
    const { error } = await supabase.from('company_content_blocks').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const move = async (block: Block, dir: -1 | 1) => {
    const sorted = [...blocks].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((b) => b.id === block.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const other = sorted[swapIdx];
    await supabase.from('company_content_blocks').update({ position: other.position }).eq('id', block.id);
    await supabase.from('company_content_blocks').update({ position: block.position }).eq('id', other.id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">Why Join Us</h3>
        </div>
        {!editing && (
          <button type="button" onClick={openNew} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700">
            <Plus className="h-4 w-4" /> New block
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-slate-400">
        These blocks render in order on your public company profile, above the About section. Mix text, quotes, stats, images, and videos to tell your story.
      </p>

      {editing && (
        <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <div>
            <label htmlFor="block-kind" className="block text-sm font-medium text-secondary-900 dark:text-white mb-1">Type</label>
            <select
              id="block-kind"
              value={draft.kind}
              onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as Draft['kind'] }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="text">Text</option>
              <option value="quote">Quote</option>
              <option value="stat">Stat</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{KIND_HINTS[draft.kind]}</p>
          </div>

          {(draft.kind === 'text' || draft.kind === 'quote' || draft.kind === 'stat' || draft.kind === 'image' || draft.kind === 'video') && (
            <input
              type="text"
              value={draft.heading ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, heading: e.target.value }))}
              placeholder={
                draft.kind === 'quote' ? 'Attribution (e.g. "Jane, CEO")'
                : draft.kind === 'stat' ? 'Label (e.g. "Employee retention")'
                : draft.kind === 'image' ? 'Caption (optional)'
                : draft.kind === 'video' ? 'Video title (optional)'
                : 'Heading (optional)'
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          )}

          {(draft.kind === 'text' || draft.kind === 'quote' || draft.kind === 'stat') && (
            <textarea
              rows={draft.kind === 'stat' ? 1 : 4}
              maxLength={3000}
              value={draft.body ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder={
                draft.kind === 'stat' ? 'The number (e.g. "95%", "$50M ARR")'
                : draft.kind === 'quote' ? 'The quote'
                : 'Body copy'
              }
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          )}

          {draft.kind === 'image' && (
            <input
              type="url"
              value={draft.image_url ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          )}

          {draft.kind === 'video' && (
            <input
              type="url"
              value={draft.video_url ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, video_url: e.target.value }))}
              placeholder="YouTube, Vimeo, or direct .mp4 URL"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700">
              <X className="h-4 w-4" /> Cancel
            </button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing === 'new' ? 'Add' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
        </div>
      ) : blocks.length === 0 && !editing ? (
        <p className="text-sm text-gray-500 dark:text-slate-400 py-8 text-center">
          No content blocks yet. Click <strong>New block</strong> to add your first one.
        </p>
      ) : (
        <ul className="space-y-3">
          {blocks.map((b, i) => (
            <li key={b.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary-600 mb-1">{b.kind}</div>
                  {b.heading && <div className="font-medium text-secondary-900 dark:text-white">{b.heading}</div>}
                  {b.body && (
                    <div className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-line line-clamp-4">{b.body}</div>
                  )}
                  {b.image_url && <div className="text-xs text-gray-500 dark:text-slate-400 truncate">img: {b.image_url}</div>}
                  {b.video_url && <div className="text-xs text-gray-500 dark:text-slate-400 truncate">video: {b.video_url}</div>}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button type="button" onClick={() => move(b, -1)} disabled={i === 0} title="Move up" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 disabled:opacity-30">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => move(b, 1)} disabled={i === blocks.length - 1} title="Move down" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 disabled:opacity-30">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => openEdit(b)} title="Edit" className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => remove(b.id)} title="Delete" className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600">
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

export default WhyJoinUsPanel;
