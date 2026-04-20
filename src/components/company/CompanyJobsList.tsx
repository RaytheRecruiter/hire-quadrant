import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, DollarSign, Calendar, Settings, X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import ScreeningQuestionsEditor from '../ScreeningQuestionsEditor';
import type { ScreeningQuestion } from '../../types/screening';

interface CompanyJobsListProps {
  jobs: any[];
}

const CompanyJobsList: React.FC<CompanyJobsListProps> = ({ jobs }) => {
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openEditor = (job: any) => {
    setEditingJobId(job.id);
    setQuestions((job.screening_questions as ScreeningQuestion[]) || []);
    setError('');
  };

  const closeEditor = () => {
    setEditingJobId(null);
    setQuestions([]);
    setError('');
  };

  const saveQuestions = async () => {
    if (!editingJobId) return;
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ screening_questions: questions })
      .eq('id', editingJobId);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    closeEditor();
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Jobs Posted Yet</h3>
        <p className="text-gray-500">Your posted jobs will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apps</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Screening</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobs.map((job) => {
              const qCount = (job.screening_questions as ScreeningQuestion[] | undefined)?.length || 0;
              return (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {job.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {job.location || 'Remote'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Clock className="h-3 w-3 mr-1" />
                      {job.type || job.job_type || 'Full-time'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                      {job.salary || job.salary_range || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {job.application_count ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {qCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {qCount} question{qCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => openEditor(job)}
                      className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium text-sm"
                    >
                      <Settings className="h-4 w-4" />
                      Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editingJobId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:max-w-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-secondary-900">Manage Screening Questions</h2>
              <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ScreeningQuestionsEditor value={questions} onChange={setQuestions} />
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeEditor}
                className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveQuestions}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 shadow-md"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyJobsList;
