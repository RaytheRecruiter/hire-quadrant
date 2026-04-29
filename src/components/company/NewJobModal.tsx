import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { geocode } from '../../utils/geocode';

interface NewJobModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
const WORKPLACE_TYPES = ['Remote', 'Hybrid', 'On-site'];
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'];

const NewJobModal: React.FC<NewJobModalProps> = ({ open, onClose, onCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Full-time');
  const [workplaceType, setWorkplaceType] = useState('Remote');
  const [experienceLevel, setExperienceLevel] = useState('Mid');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const reset = () => {
    setTitle('');
    setLocation('');
    setType('Full-time');
    setWorkplaceType('Remote');
    setExperienceLevel('Mid');
    setSalary('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) {
      toast.error('Your account is not linked to a company yet.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    setSubmitting(true);
    // jobs.id is text — generate a UI-prefixed UUID so it never collides with
    // the "26-XXXXX" external feed format.
    const newId = `ui-${crypto.randomUUID()}`;

    // Geocode the location (best-effort) so the job participates in
    // mile-radius search. Failure here is non-fatal — the job still posts.
    let lat: number | null = null;
    let lng: number | null = null;
    if (location.trim() && workplaceType !== 'Remote') {
      const result = await geocode(location.trim());
      if (result) {
        lat = result.lat;
        lng = result.lng;
      }
    }

    const { error } = await supabase.from('jobs').insert({
      id: newId,
      title: title.trim(),
      company_id: user.companyId,
      // Per Scott Phase 2 #4: track who posted each job for the
      // Recruiter Activity panel.
      posted_by: user.id,
      location: location.trim() || null,
      lat,
      lng,
      type,
      workplace_type: workplaceType,
      experience_level: experienceLevel,
      salary: salary.trim() || null,
      description: description.trim(),
      posted_date: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) {
      toast.error(`Failed to post job: ${error.message}`);
      return;
    }
    toast.success('Job posted');
    reset();
    onClose();
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-label="New job">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl">
          <h2 className="text-xl font-semibold text-secondary-900 dark:text-white">Post a new job</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="job-title" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="job-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior Backend Engineer"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="job-location" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
                Location
              </label>
              <input
                id="job-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="San Francisco, CA / Remote"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>
            <div>
              <label htmlFor="job-salary" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
                Salary range
              </label>
              <input
                id="job-salary"
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="$120k–$160k"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="job-type" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
                Type
              </label>
              <select
                id="job-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              >
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="job-workplace" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
                Workplace
              </label>
              <select
                id="job-workplace"
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              >
                {WORKPLACE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="job-experience" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
                Experience
              </label>
              <select
                id="job-experience"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              >
                {EXPERIENCE_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="job-description" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="job-description"
              required
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Use markdown for headers (## Responsibilities) and bullets (- list item)…"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold disabled:opacity-60 inline-flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Posting…' : 'Post job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewJobModal;
