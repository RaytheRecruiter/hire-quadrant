import React, { useState } from 'react';
import { X, Star, Save, Loader2, Tag, Bookmark, Sparkles } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { screenCandidate, CandidateScreening } from '../../utils/aiClient';
import ApplicantNotesAndTags from './ApplicantNotesAndTags';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import { CalendarClock } from 'lucide-react';

interface Props {
  open: boolean;
  application: any | null;
  candidate: any | null;
  job?: any | null;
  onClose: () => void;
  onSaved: () => void;
}

const ApplicantDetailModal: React.FC<Props> = ({ open, application, candidate, job, onClose, onSaved }) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const [rating, setRating] = useState<number>(application?.employer_rating || 0);
  const [notes, setNotes] = useState<string>(application?.employer_notes || '');
  const [tagsInput, setTagsInput] = useState<string>((application?.employer_tags || []).join(', '));
  const [shortlisted, setShortlisted] = useState<boolean>(!!application?.is_shortlisted);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<CandidateScreening | null>(null);
  const [aiError, setAiError] = useState('');

  React.useEffect(() => {
    setRating(application?.employer_rating || 0);
    setNotes(application?.employer_notes || '');
    setTagsInput((application?.employer_tags || []).join(', '));
    setShortlisted(!!application?.is_shortlisted);
  }, [application]);

  if (!open || !application) return null;

  const runAIScreening = async () => {
    setAiError('');
    setAiLoading(true);
    try {
      const result = await screenCandidate({
        jobTitle: job?.title || '',
        jobDescription: job?.description || '',
        candidateName: candidate?.name || application.user_name,
        candidateSummary: [candidate?.headline, candidate?.location, candidate?.years_experience ? `${candidate.years_experience} years experience` : ''].filter(Boolean).join(' • '),
        screeningAnswers: application.screening_answers || [],
      });
      setAiResult(result);
    } catch (err: any) {
      setAiError(err.message || 'AI screening failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const { error } = await supabase
      .from('job_applications')
      .update({
        employer_rating: rating || null,
        employer_notes: notes || null,
        employer_tags: tags,
        is_shortlisted: shortlisted,
      })
      .eq('id', application.id);
    setSaving(false);
    if (!error) {
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:max-w-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">{candidate?.name || application.user_name || 'Applicant'}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{candidate?.email || application.user_email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Star rating */}
          <div>
            <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">Candidate Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n === rating ? 0 : n)}
                  className="p-1"
                >
                  <Star className={`h-7 w-7 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
              <span className="ml-3 text-sm text-gray-500 dark:text-slate-400">{rating > 0 ? `${rating} / 5` : 'No rating'}</span>
            </div>
          </div>

          {/* Shortlist toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={shortlisted}
                onChange={e => setShortlisted(e.target.checked)}
                className="rounded text-primary-500 focus:ring-primary-400 h-5 w-5"
              />
              <Bookmark className={`h-5 w-5 ${shortlisted ? 'fill-primary-500 text-primary-500' : 'text-gray-400 dark:text-slate-500'}`} />
              <span className="font-medium text-secondary-800 dark:text-slate-200">Shortlist this candidate</span>
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. senior, full-stack, strong-communicator"
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">Private Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={6}
              placeholder="Only visible to your company."
              className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* CRM notes + tags (team-wide) */}
          {application?.id && (
            <div className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
              <ApplicantNotesAndTags applicationId={application.id} />
            </div>
          )}

          {/* AI Screening */}
          <div className="border border-primary-200 rounded-2xl p-4 bg-primary-50/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                <span className="font-semibold text-secondary-800 dark:text-slate-200">AI Candidate Screening</span>
              </div>
              <button
                onClick={runAIScreening}
                disabled={aiLoading}
                className="flex items-center gap-2 bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {aiLoading ? 'Analyzing...' : aiResult ? 'Re-run' : 'Run AI Screening'}
              </button>
            </div>
            {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}
            {aiResult && (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold text-primary-600">{aiResult.fit_score}</div>
                  <div className="text-gray-500 dark:text-slate-400">Fit score /100</div>
                </div>
                <p className="text-gray-800 dark:text-slate-200">{aiResult.summary}</p>
                {aiResult.strengths?.length > 0 && (
                  <div>
                    <div className="font-semibold text-green-700 mb-1">Strengths</div>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-slate-300">
                      {aiResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {aiResult.concerns?.length > 0 && (
                  <div>
                    <div className="font-semibold text-amber-700 mb-1">Concerns</div>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-slate-300">
                      {aiResult.concerns.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Screening answers if any */}
          {application.screening_answers && application.screening_answers.length > 0 && (
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4">
              <p className="text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-3">Screening Answers</p>
              <ul className="space-y-2 text-sm">
                {application.screening_answers.map((a: any, i: number) => (
                  <li key={i}>
                    <span className="text-gray-500 dark:text-slate-400">Q{i + 1}:</span>{' '}
                    <span className="text-gray-800 dark:text-slate-200 font-medium">{a.answer || '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowSchedule(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <CalendarClock className="h-4 w-4" />
            Schedule interview
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 shadow-md"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
      {showSchedule && application?.id && (
        <ScheduleInterviewModal
          applicationId={application.id}
          candidateName={candidate?.name ?? application.user_name ?? null}
          candidateEmail={candidate?.email ?? application.user_email ?? null}
          jobTitle={job?.title ?? null}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </div>
  );
};

export default ApplicantDetailModal;
