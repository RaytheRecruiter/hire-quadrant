import React, { useMemo, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Applicant {
  id: string;
  user_id: string;
  user_name?: string | null;
  user_email?: string | null;
  status: string;
}

interface Props {
  applicants: Applicant[];
  companyId?: string;
  onClose?: () => void;
}

const BulkMessageComposer: React.FC<Props> = ({ applicants, companyId, onClose }) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(applicants.map((a) => a.user_id)),
  );
  const [sending, setSending] = useState(false);

  const recipientIds = useMemo(() => Array.from(selected), [selected]);

  const toggle = (userId: string) => {
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const send = async () => {
    if (!user?.id || !body.trim() || recipientIds.length === 0) return;
    setSending(true);

    // Log bulk message
    const { data: bulkRow, error: bulkErr } = await supabase
      .from('bulk_messages')
      .insert({
        author_id: user.id,
        recipient_ids: recipientIds,
        subject: subject.trim() || null,
        body: body.trim(),
      })
      .select()
      .single();

    if (bulkErr) {
      setSending(false);
      toast.error(bulkErr.message);
      return;
    }

    // Fan out as in-app messages via the conversations/messages tables.
    // conversations' real columns are employer_id/candidate_id/company_id
    // (20260424_messaging_and_notifications.sql) -- this used to upsert
    // participant_a/participant_b, which don't exist on this table at all,
    // confirmed live (N19 QA 2026-10-18): every upsert 400'd, the error was
    // never even captured (destructured away), and the function still
    // reported "Sent to 0 applicants" as a *success* toast. This has never
    // actually sent a single message.
    const now = new Date().toISOString();
    const messagePayload: Array<{ conversation_id: string; sender_id: string; body: string }> = [];
    let failures = 0;
    for (const candidateId of recipientIds) {
      const { data: convo, error: convoErr } = await supabase
        .from('conversations')
        .upsert(
          { employer_id: user.id, candidate_id: candidateId, company_id: companyId ?? null, last_message_at: now },
          { onConflict: 'employer_id,candidate_id,company_id' },
        )
        .select('id')
        .single();
      if (convoErr || !convo?.id) {
        console.error('Failed to start conversation with', candidateId, convoErr);
        failures += 1;
        continue;
      }
      messagePayload.push({
        conversation_id: convo.id,
        sender_id: user.id,
        body: subject.trim() ? `${subject.trim()}\n\n${body.trim()}` : body.trim(),
      });
    }

    if (messagePayload.length > 0) {
      const { error: msgErr } = await supabase.from('messages').insert(messagePayload);
      if (msgErr) {
        console.error('Failed to send messages:', msgErr);
        failures += messagePayload.length;
        messagePayload.length = 0;
      }
    }

    setSending(false);
    if (messagePayload.length > 0) {
      toast.success(`Sent to ${messagePayload.length} applicant${messagePayload.length === 1 ? '' : 's'}`);
    }
    if (failures > 0) {
      toast.error(`Failed to send to ${failures} applicant${failures === 1 ? '' : 's'}`);
    }
    if (messagePayload.length > 0) onClose?.();
    // swallow unused to satisfy linter
    void bulkRow;
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary-500" />
            <h2 className="font-semibold text-secondary-900 dark:text-white">Bulk message</h2>
            <span className="text-xs text-gray-500 dark:text-slate-400">
              {selected.size} of {applicants.length} selected
            </span>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </header>

        <div className="p-4 grid md:grid-cols-[240px_1fr] gap-4">
          <aside className="max-h-80 overflow-auto border border-gray-100 dark:border-slate-700 rounded-lg">
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {applicants.map((a) => (
                <li key={a.id} className="px-3 py-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(a.user_id)}
                    onChange={() => toggle(a.user_id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-secondary-900 dark:text-white truncate">
                      {a.user_name ?? a.user_email ?? 'Applicant'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 capitalize">
                      {a.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <div>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
              maxLength={100}
              className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500 mb-2"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={10}
              maxLength={5000}
              className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500 mb-2"
            />
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-3">
              Sent as in-app direct message to each recipient. Email delivery depends on the recipient's notification preferences.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={sending || !body.trim() || recipientIds.length === 0}
                className="inline-flex items-center gap-1 px-4 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkMessageComposer;
