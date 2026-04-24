import React, { useEffect, useState } from 'react';
import { CheckCircle, Loader2, Send, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import type { ScreeningQuestion, ScreeningAnswer } from '../types/screening';

export interface SubmittedApplicationDetails {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  zip?: string;
  coverLetter?: string;
  resumeUrl?: string;
  eeo: {
    race_ethnicity?: string;
    gender?: string;
    disability?: string;
    veteran?: string;
  };
  privacyAcceptedAt: string;
}

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  company?: string;
  screeningQuestions: ScreeningQuestion[];
  applied: boolean;
  onSubmit: (answers: ScreeningAnswer[], details: SubmittedApplicationDetails) => Promise<boolean>;
}

const MAX_RESUME_BYTES = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_EXTS = ['.pdf', '.doc', '.docx', '.txt'];
const ACCEPTED_MIME = '.pdf,.doc,.docx,.txt';

const RACE_OPTIONS = [
  'Hispanic or Latino',
  'White',
  'Black or African American',
  'Asian',
  'American Indian or Alaska Native',
  'Native Hawaiian or Other Pacific Islander',
  'Two or More Races',
  'Prefer not to say',
];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const DISABILITY_OPTIONS = [
  "Yes, I have a disability or have a record of having a disability",
  "No, I don't have a disability or have a record of having a disability",
  "I don't wish to answer",
];
const VETERAN_OPTIONS = [
  'I identify as a protected veteran',
  'I am not a protected veteran',
  "I don't wish to answer",
];

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  jobId,
  jobTitle,
  company,
  screeningQuestions,
  applied,
  onSubmit,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zip, setZip] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [existingResumePath, setExistingResumePath] = useState<string | null>(null);
  const [raceEthnicity, setRaceEthnicity] = useState('');
  const [gender, setGender] = useState('');
  const [disability, setDisability] = useState('');
  const [veteran, setVeteran] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const parts = (user.name || '').trim().split(/\s+/);
    if (parts.length > 0) {
      setFirstName(parts[0] || '');
      if (parts.length > 1) setLastName(parts.slice(1).join(' '));
    }
    setEmail(user.email || '');
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('candidates')
        .select('phone_number, location, resume_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data?.phone_number) setPhone(data.phone_number);
      if (data?.resume_url) setExistingResumePath(data.resume_url);
      setProfileLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleChangeScreening = (qId: string, value: string) => {
    setScreeningAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      setResumeFile(null);
      return;
    }
    const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_EXTS.includes(ext)) {
      toast.error(`Resume must be one of: ${ACCEPTED_EXTS.join(', ')}`);
      e.target.value = '';
      return;
    }
    if (f.size > MAX_RESUME_BYTES) {
      toast.error('Resume exceeds the 50 MB limit');
      e.target.value = '';
      return;
    }
    setResumeFile(f);
  };

  const uploadResume = async (): Promise<string | null> => {
    if (!resumeFile || !user) return null;
    const ext = resumeFile.name.split('.').pop() || 'pdf';
    const path = `applications/${user.id}/${jobId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('resumes')
      .upload(path, resumeFile, { upsert: false, contentType: resumeFile.type || undefined });
    if (error) {
      toast.error(`Resume upload failed: ${error.message}`);
      return null;
    }
    return path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to apply.');
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast.error('Name, email, and phone are required.');
      return;
    }
    if (!resumeFile && !existingResumePath) {
      toast.error('Please upload a resume.');
      return;
    }
    if (!privacyAccepted) {
      toast.error('Please agree to the privacy policy to continue.');
      return;
    }
    const requiredUnanswered = screeningQuestions.filter(
      (q) => q.required && !(screeningAnswers[q.id || q.prompt]?.trim())
    );
    if (requiredUnanswered.length > 0) {
      toast.error('Please answer all required screening questions.');
      return;
    }

    setSubmitting(true);
    try {
      let resumeUrl: string | null = existingResumePath;
      if (resumeFile) {
        const uploaded = await uploadResume();
        if (!uploaded) {
          setSubmitting(false);
          return;
        }
        resumeUrl = uploaded;
      }

      const answers: ScreeningAnswer[] = screeningQuestions.map((q) => ({
        question_id: q.id || q.prompt,
        question: q.prompt,
        answer: (screeningAnswers[q.id || q.prompt] || '').trim(),
      }));

      const ok = await onSubmit(answers, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        phone: phone.trim(),
        zip: zip.trim() || undefined,
        coverLetter: coverLetter.trim() || undefined,
        resumeUrl: resumeUrl || undefined,
        eeo: {
          race_ethnicity: raceEthnicity || undefined,
          gender: gender || undefined,
          disability: disability || undefined,
          veteran: veteran || undefined,
        },
        privacyAcceptedAt: new Date().toISOString(),
      });
      if (ok) {
        toast.success('Application submitted!');
      } else {
        toast.error('Could not submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white dark:bg-slate-900 text-secondary-900 dark:text-white';
  const labelClass = 'block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-1';

  return (
    <section
      id="apply-form"
      className="mt-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-soft scroll-mt-24"
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-secondary-900 dark:text-white">
          Apply for this role
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
          {company ? `Submit your application to ${company}.` : 'Submit your application below.'}
        </p>
      </div>

      {!isAuthenticated ? (
        <div className="rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-5 text-sm text-primary-900 dark:text-primary-100">
          <p className="font-semibold mb-1">Sign in or create an account to apply</p>
          <p className="mb-4">
            You need an account to submit an application for <span className="font-semibold">{jobTitle}</span>. It takes less than a minute.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/login?returnTo=${encodeURIComponent(`/jobs/${jobId}#apply-form`)}&intent=apply`}
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Sign in
            </a>
            <a
              href={`/register?returnTo=${encodeURIComponent(`/jobs/${jobId}#apply-form`)}&intent=apply`}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-primary-700 border border-primary-200 dark:bg-slate-800 dark:text-primary-300 dark:border-primary-700 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Create an account
            </a>
          </div>
        </div>
      ) : applied ? (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-5 text-emerald-900 dark:text-emerald-100">
          <CheckCircle className="h-6 w-6 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-semibold">Application submitted</p>
            <p className="text-sm">You'll be notified when the employer reviews your application.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First"
                required
                className={inputClass}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Resume */}
          <div>
            <label className={labelClass}>
              Resume <span className="text-red-500">*</span>
            </label>
            <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <Upload className="h-5 w-5 text-gray-500 dark:text-slate-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-slate-300 truncate">
                {resumeFile
                  ? resumeFile.name
                  : existingResumePath
                    ? 'Using resume on file — click to replace'
                    : 'No file chosen'}
              </span>
              <input
                type="file"
                accept={ACCEPTED_MIME}
                onChange={handleResumeChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Accepted file types: pdf, docx, doc, txt. Max. file size: 50 MB.
            </p>
            {existingResumePath && !resumeFile && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Your existing resume will be used unless you upload a new one.
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 123 4567"
              required
              className={inputClass}
            />
            {!profileLoaded && (
              <p className="text-xs text-gray-500 mt-1">Loading your saved profile…</p>
            )}
          </div>

          {/* Zip */}
          <div>
            <label className={labelClass}>Current Zip Code</label>
            <input
              type="text"
              inputMode="numeric"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder="90210"
              className={inputClass}
            />
          </div>

          {/* Cover letter */}
          <div>
            <label className={labelClass}>
              Cover letter <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Tell the employer why you'd be a great fit."
              className={inputClass}
            />
          </div>

          {/* EEO */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-5">
            <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
              We are an equal opportunity employer. We honor diversity and are committed to creating
              an inclusive environment for everyone. Help us get to know you better by responding to
              these optional questions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className={labelClass}>Race &amp; Ethnicity</label>
                <select
                  value={raceEthnicity}
                  onChange={(e) => setRaceEthnicity(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {RACE_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Disability</label>
                <select
                  value={disability}
                  onChange={(e) => setDisability(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {DISABILITY_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Protected Veteran</label>
                <select
                  value={veteran}
                  onChange={(e) => setVeteran(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select…</option>
                  {VETERAN_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Screening questions */}
          {screeningQuestions.length > 0 && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-5 space-y-4">
              <p className="text-sm font-semibold text-secondary-800 dark:text-slate-200">
                Screening questions
              </p>
              {screeningQuestions.map((q) => {
                const key = q.id || q.prompt;
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium text-secondary-800 dark:text-slate-200 mb-1">
                      {q.prompt}
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <textarea
                      value={screeningAnswers[key] || ''}
                      onChange={(e) => handleChangeScreening(key, e.target.value)}
                      rows={3}
                      required={q.required}
                      className={inputClass}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Privacy consent */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-5">
            <label className="flex items-start gap-3 text-sm text-secondary-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                required
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
              />
              <span>
                By submitting you agree to our{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-semibold">
                  Privacy Policy
                </a>{' '}
                <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit application
              </>
            )}
          </button>
        </form>
      )}
    </section>
  );
};

export default JobApplicationForm;
