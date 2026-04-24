import React, { useMemo, useState } from 'react';
import { CalendarClock, X, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { downloadIcs } from '../../utils/ics';

interface Props {
  applicationId: string;
  candidateName?: string | null;
  candidateEmail?: string | null;
  jobTitle?: string | null;
  onClose: () => void;
  onScheduled?: () => void;
}

const ScheduleInterviewModal: React.FC<Props> = ({
  applicationId,
  candidateName,
  candidateEmail,
  jobTitle,
  onClose,
  onScheduled,
}) => {
  const { user } = useAuth();
  const today = new Date();
  const [date, setDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2).toISOString().slice(0, 10),
  );
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('Video call');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const start = useMemo(() => new Date(`${date}T${time}:00`), [date, time]);
  const end = useMemo(() => new Date(start.getTime() + duration * 60_000), [start, duration]);

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('scheduled_interviews')
      .insert({
        application_id: applicationId,
        scheduled_for: start.toISOString(),
        duration_minutes: duration,
        location: location.trim() || null,
        meeting_url: meetingUrl.trim() || null,
        notes: notes.trim() || null,
        status: 'proposed',
        created_by: user.id,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Interview scheduled');

    // Best-effort: send a message with the details.
    const body =
      `Interview scheduled for ${start.toLocaleString()}\n` +
      `Duration: ${duration} minutes\n` +
      (location ? `Where: ${location}\n` : '') +
      (meetingUrl ? `Link: ${meetingUrl}\n` : '') +
      (notes ? `\nNotes:\n${notes}` : '');
    try {
      const applicantId = (
        await supabase.from('job_applications').select('user_id').eq('id', applicationId).maybeSingle()
      ).data?.user_id;
      if (applicantId) {
        const { data: convo } = await supabase
          .from('conversations')
          .upsert(
            { participant_a: user.id, participant_b: applicantId, last_message_at: new Date().toISOString() },
            { onConflict: 'participant_a,participant_b' },
          )
          .select('id')
          .single();
        if (convo?.id) {
          await supabase.from('messages').insert({
            conversation_id: convo.id,
            sender_id: user.id,
            body: `Interview scheduled\n\n${body}`,
          });
        }
      }
    } catch {
      // non-fatal
    }

    onScheduled?.();
    onClose();
    void data;
  };

  const downloadInvite = () => {
    downloadIcs(
      {
        uid: `hirequadrant-${applicationId}-${start.getTime()}@hirequadrant.com`,
        title: jobTitle ? `Interview: ${jobTitle}` : 'Interview',
        description: notes || 'Interview scheduled via HireQuadrant.',
        location: meetingUrl || location,
        startUtc: start,
        endUtc: end,
        organizerEmail: user?.email,
        attendeeEmail: candidateEmail ?? undefined,
        url: meetingUrl || undefined,
      },
      `${(candidateName || 'interview').replace(/\W+/g, '-').toLowerCase()}.ics`,
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary-500" />
            <h2 className="font-semibold text-secondary-900 dark:text-white">Schedule interview</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </header>

        <div className="p-4 space-y-3">
          {candidateName && (
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Candidate: <span className="font-medium text-secondary-900 dark:text-white">{candidateName}</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
            >
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Where</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Video call, office, phone"
              className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Meeting link</label>
            <input
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What to prepare, who will attend..."
              className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 p-4 border-t border-gray-100 dark:border-slate-700">
          <button
            type="button"
            onClick={downloadInvite}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            .ics
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1 px-4 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Schedule
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
