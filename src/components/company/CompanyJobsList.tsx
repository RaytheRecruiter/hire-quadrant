import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import HardLink from '../HardLink';
import toast from 'react-hot-toast';
import { Briefcase, MapPin, Clock, DollarSign, Calendar, Settings, X, Save, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import ScreeningQuestionsEditor from '../ScreeningQuestionsEditor';
import CustomFieldsEditor from './CustomFieldsEditor';
import type { ScreeningQuestion } from '../../types/screening';

interface CompanyJobsListProps {
  jobs: any[];
}

const CompanyJobsList: React.FC<CompanyJobsListProps> = ({ jobs }) => {
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sponsorBusyId, setSponsorBusyId] = useState<string | null>(null);
  // Local override so the select reflects saved state without a full refresh
  const [sponsorTiers, setSponsorTiers] = useState<Record<string, number>>({});

  const getTier = (job: any): number => {
    if (job.id in sponsorTiers) return sponsorTiers[job.id];
    return job.is_sponsored ? job.sponsor_tier ?? 1 : 0;
  };

  const updateSponsor = async (jobId: string, tier: number) => {
    setSponsorBusyId(jobId);
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ is_sponsored: tier > 0, sponsor_tier: tier })
      .eq('id', jobId);
    setSponsorBusyId(null);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    setSponsorTiers((m) => ({ ...m, [jobId]: tier }));
    toast.success(tier === 0 ? 'Listing unsponsored' : `Promoted to tier ${tier}`);
  };

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
        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">No Jobs Posted Yet</h3>
        <p className="text-gray-500 dark:text-slate-400">Your posted jobs will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Posted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Apps</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Screening</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Sponsor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {jobs.map((job) => {
              const qCount = (job.screening_questions as ScreeningQuestion[] | undefined)?.length || 0;
              return (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <HardLink
                      to={`/jobs/${job.id}`}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {job.title}
                    </HardLink>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500" />
                      {job.location || 'Remote'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Clock className="h-3 w-3 mr-1" />
                      {job.type || job.job_type || 'Full-time'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500" />
                      {job.salary || job.salary_range || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400 dark:text-slate-500" />
                      {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {job.application_count ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400">
                    {qCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {qCount} question{qCount === 1 ? '' : 's'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-slate-500">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <select
                        value={getTier(job)}
                        onChange={(e) => updateSponsor(job.id, Number(e.target.value))}
                        disabled={sponsorBusyId === job.id}
                        aria-label="Sponsor tier"
                        className="text-xs rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60"
                      >
                        <option value={0}>Off</option>
                        <option value={1}>Tier 1</option>
                        <option value={2}>Tier 2</option>
                        <option value={3}>Tier 3</option>
                      </select>
                      {getTier(job) > 0 && (
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" aria-label="Sponsored" />
                      )}
                    </div>
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
          <div className="bg-white dark:bg-slate-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:max-w-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-secondary-900 dark:text-white">Manage Screening Questions</h2>
              <button onClick={closeEditor} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <ScreeningQuestionsEditor value={questions} onChange={setQuestions} />
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
              )}
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
                <CustomFieldsEditor jobId={editingJobId} />
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeEditor}
                className="px-5 py-2.5 rounded-xl text-gray-600 dark:text-slate-400 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 dark:bg-slate-700 transition-colors"
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
