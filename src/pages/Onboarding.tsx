import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import toast from 'react-hot-toast';

const Onboarding: React.FC = () => {
  const { user, loading: authLoading, isCompany, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [years, setYears] = useState<number>(0);
  const [skills, setSkills] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (isCompany || isAdmin) return <Navigate to="/" replace />;

  const totalSteps = 3;

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('resumes').upload(filePath, file);
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    const { error: upsertErr } = await supabase
      .from('candidates')
      .upsert({ user_id: user.id, email: user.email, resume_url: data.path }, { onConflict: 'user_id' });
    if (upsertErr) { toast.error('Could not save resume'); }
    else { setResumeUploaded(true); toast.success('Resume uploaded'); }
    setUploading(false);
  };

  const saveStepAndAdvance = async () => {
    setSaving(true);
    const updates: any = { user_id: user.id, email: user.email };
    if (step === 1) { updates.location = location; updates.headline = headline; }
    if (step === 2) {
      updates.years_experience = years || null;
      updates.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    const { error } = await supabase.from('candidates').upsert(updates, { onConflict: 'user_id' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (step === totalSteps) { toast.success('All set — welcome!'); navigate('/'); }
    else setStep(s => s + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50/60 py-12">
      <div className="max-w-xl mx-auto px-4">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map(n => (
            <React.Fragment key={n}>
              <div className={`h-2 flex-1 rounded-full transition-colors ${
                n <= step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-slate-700'
              }`} />
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-gray-100 dark:border-slate-700 p-8 md:p-10 animate-fade-in">
          {step === 1 && (
            <>
              <h1 className="font-display text-3xl font-bold text-secondary-900 dark:text-white mb-2">Welcome to HireQuadrant, {user.name?.split(' ')[0] || 'there'}!</h1>
              <p className="text-secondary-600 mb-8">Let's personalize your experience in 3 quick steps.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">Where are you based?</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Austin, TX or Remote"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">What's your professional headline?</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="e.g. Senior React Engineer · 7 years"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-3xl font-bold text-secondary-900 dark:text-white mb-2">Tell us about your experience</h1>
              <p className="text-secondary-600 mb-8">This helps us match you with the right roles.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">Years of experience</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 3, 5, 7, 10, 15, 20].map(y => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setYears(y)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                          years === y ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:border-slate-600'
                        }`}
                      >
                        {y === 0 ? '< 1 yr' : `${y}+ yrs`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">Top skills (comma-separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={e => setSkills(e.target.value)}
                    placeholder="e.g. React, TypeScript, Python, AWS"
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-display text-3xl font-bold text-secondary-900 dark:text-white mb-2">Upload your resume</h1>
              <p className="text-secondary-600 mb-8">PDF or DOCX works best. You can update it anytime.</p>

              {resumeUploaded ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-900">Resume uploaded</div>
                    <div className="text-sm text-emerald-700">You're all set. Click Finish to start browsing jobs.</div>
                  </div>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-10 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                  <Upload className="h-10 w-10 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
                  <div className="font-semibold text-secondary-800 dark:text-slate-200">
                    {uploading ? 'Uploading…' : 'Click to upload resume'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-slate-400 mt-1">PDF or DOCX, up to 5MB</div>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              )}
            </>
          )}

          <div className="mt-10 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="inline-flex items-center gap-1 text-secondary-600 hover:text-secondary-800 dark:text-slate-200 font-semibold"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
              {step < 3 && (
                <button onClick={() => navigate('/')} className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400">
                  Skip for now
                </button>
              )}
              <button
                onClick={saveStepAndAdvance}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-soft disabled:opacity-50 transition-all"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {step === totalSteps ? 'Finish' : 'Continue'}
                {step < totalSteps && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400 dark:text-slate-500">Step {step} of {totalSteps}</p>
      </div>
    </div>
  );
};

export default Onboarding;
