import React from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import type { ScreeningQuestion, ScreeningQuestionType } from '../types/screening';

interface Props {
  value: ScreeningQuestion[];
  onChange: (questions: ScreeningQuestion[]) => void;
  maxQuestions?: number;
}

const TYPE_OPTIONS: { value: ScreeningQuestionType; label: string }[] = [
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'short_text', label: 'Short Text' },
  { value: 'number', label: 'Number' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
];

const newId = () => `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const ScreeningQuestionsEditor: React.FC<Props> = ({ value, onChange, maxQuestions = 5 }) => {
  const updateQuestion = (id: string, patch: Partial<ScreeningQuestion>) => {
    onChange(value.map(q => (q.id === id ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => {
    if (value.length >= maxQuestions) return;
    onChange([
      ...value,
      {
        id: newId(),
        type: 'yes_no',
        question: '',
        required: true,
        knockout: false,
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    onChange(value.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200">
          Screening Questions <span className="text-gray-400 dark:text-slate-500 font-normal">(optional)</span>
        </label>
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Pre-qualify applicants. Add up to {maxQuestions} questions.
        </p>
      </div>

      {value.length === 0 && (
        <div className="bg-gray-50 dark:bg-slate-900/50 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 text-center text-sm text-gray-500 dark:text-slate-400">
          No screening questions yet.
        </div>
      )}

      {value.map((q, idx) => (
        <div key={q.id} className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Question {idx + 1}</span>
            <button
              type="button"
              onClick={() => removeQuestion(q.id)}
              className="text-gray-400 dark:text-slate-500 hover:text-red-600 transition-colors"
              aria-label="Remove question"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Type</label>
              <select
                value={q.type}
                onChange={e => updateQuestion(q.id, { type: e.target.value as ScreeningQuestionType, expectedAnswer: undefined, choices: undefined })}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Question</label>
              <input
                type="text"
                value={q.question}
                onChange={e => updateQuestion(q.id, { question: e.target.value })}
                placeholder="e.g. Do you have 5+ years of React experience?"
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {q.type === 'multiple_choice' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Choices (one per line)</label>
              <textarea
                value={(q.choices || []).join('\n')}
                onChange={e => updateQuestion(q.id, { choices: e.target.value.split('\n').filter(Boolean) })}
                rows={3}
                className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={q.required}
                onChange={e => updateQuestion(q.id, { required: e.target.checked })}
                className="rounded text-primary-500 focus:ring-primary-400"
              />
              <span className="text-gray-700 dark:text-slate-300">Required</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer" title="Automatically reject applicants who don't meet the expected answer">
              <input
                type="checkbox"
                checked={q.knockout}
                onChange={e => updateQuestion(q.id, { knockout: e.target.checked })}
                className="rounded text-primary-500 focus:ring-primary-400"
              />
              <span className="text-gray-700 dark:text-slate-300 flex items-center gap-1">
                Knockout <HelpCircle className="h-3 w-3 text-gray-400 dark:text-slate-500" />
              </span>
            </label>
          </div>

          {q.knockout && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Required answer for qualification</label>
              {q.type === 'yes_no' ? (
                <select
                  value={q.expectedAnswer || 'yes'}
                  onChange={e => updateQuestion(q.id, { expectedAnswer: e.target.value })}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              ) : q.type === 'multiple_choice' ? (
                <select
                  value={q.expectedAnswer || ''}
                  onChange={e => updateQuestion(q.id, { expectedAnswer: e.target.value })}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="">— Select —</option>
                  {(q.choices || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : q.type === 'number' ? (
                <input
                  type="number"
                  placeholder="Minimum value"
                  value={q.expectedAnswer || ''}
                  onChange={e => updateQuestion(q.id, { expectedAnswer: e.target.value })}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Expected answer (contains)"
                  value={q.expectedAnswer || ''}
                  onChange={e => updateQuestion(q.id, { expectedAnswer: e.target.value })}
                  className="w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              )}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        disabled={value.length >= maxQuestions}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-200 text-primary-600 font-medium text-sm hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-4 w-4" /> Add Question
      </button>
    </div>
  );
};

export default ScreeningQuestionsEditor;
