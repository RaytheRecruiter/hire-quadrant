import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { ScreeningQuestion, ScreeningAnswer } from '../types/screening';

interface Props {
  open: boolean;
  questions: ScreeningQuestion[];
  companyName: string;
  onClose: () => void;
  onSubmit: (answers: ScreeningAnswer[]) => Promise<void>;
}

const ScreeningQuestionsModal: React.FC<Props> = ({ open, questions, companyName, onClose, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const isComplete = questions
    .filter(q => q.required)
    .every(q => (answers[q.id] || '').trim() !== '');

  const handleSubmit = async () => {
    setError('');
    if (!isComplete) {
      setError('Please answer all required questions.');
      return;
    }
    setSubmitting(true);
    try {
      const payload: ScreeningAnswer[] = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || '',
      }));
      await onSubmit(payload);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:max-w-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Quick questions from {companyName}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Please answer before submitting your application.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id}>
              <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">
                {idx + 1}. {q.question}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {q.type === 'yes_no' ? (
                <div className="flex gap-3">
                  {['yes', 'no'].map(v => (
                    <label key={v} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[q.id] === v
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:border-slate-600'
                    }`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={v}
                        checked={answers[q.id] === v}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="sr-only"
                      />
                      <span className="capitalize font-medium">{v}</span>
                    </label>
                  ))}
                </div>
              ) : q.type === 'multiple_choice' ? (
                <select
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">— Select —</option>
                  {(q.choices || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : q.type === 'number' ? (
                <input
                  type="number"
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              ) : (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              )}
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isComplete || submitting}
            className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreeningQuestionsModal;
