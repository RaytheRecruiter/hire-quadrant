import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, MapPin, User, Loader2, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Candidate {
  user_id: string;
  name?: string;
  email?: string;
  location?: string;
  headline?: string;
  skills?: string[];
  years_experience?: number;
  resume_url?: string;
  open_to_work?: boolean;
  current_role?: string;
  target_role?: string;
}

const ResumeSearch: React.FC = () => {
  const { isCompany, isAdmin, loading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [minYears, setMinYears] = useState<number>(0);

  const fetchCandidates = async () => {
    setLoading(true);
    let q = supabase
      .from('candidates')
      .select('*')
      .eq('open_to_work', true)
      .order('years_experience', { ascending: false, nullsFirst: false });

    if (location) q = q.ilike('location', `%${location}%`);
    if (minYears > 0) q = q.gte('years_experience', minYears);
    if (query) {
      q = q.or(`headline.ilike.%${query}%,resume_text.ilike.%${query}%,name.ilike.%${query}%`);
    }

    const { data: candidateData, error } = await q.limit(50);
    if (!error && candidateData) {
      // Fetch career settings for all candidates
      const userIds = candidateData.map(c => c.user_id);
      const { data: careerData } = await supabase
        .from('user_career_settings')
        .select('user_id, current_role, target_role')
        .in('user_id', userIds);

      // Merge career settings into candidates
      const careerMap = new Map((careerData || []).map(c => [c.user_id, c]));
      const enriched = candidateData.map(c => ({
        ...c,
        ...(careerMap.get(c.user_id) || {}),
      }));

      setCandidates(enriched);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleResumeDownload = async (candidate: Candidate) => {
    if (!candidate.resume_url) return toast.error('No resume uploaded.');
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(candidate.resume_url, 3600);
    if (error) return toast.error('Could not generate download link.');
    window.open(data.signedUrl, '_blank');
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  if (!isCompany && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
            Resume Database
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">Search candidates open to new opportunities.</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm shadow-lg border border-white/20 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Skill, headline, or keyword"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <select
                value={minYears}
                onChange={e => setMinYears(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none"
              >
                <option value="0">Any experience</option>
                <option value="1">1+ years</option>
                <option value="3">3+ years</option>
                <option value="5">5+ years</option>
                <option value="10">10+ years</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={fetchCandidates}
              className="bg-gradient-to-r from-primary-400 to-primary-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all"
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-500" /></div>
        ) : candidates.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow p-12 text-center">
            <User className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 dark:text-slate-400">No candidates match your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* PII (name / phone / email) hidden in the overview per Scott
                2026-04-28 — only skills + role + location surface here.
                Full candidate identity is revealed only when an employer
                opens the detail / downloads the resume. */}
            {candidates.map((c, idx) => (
              <div key={c.user_id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="font-bold text-primary-600">#</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-secondary-900 dark:text-white">Candidate {idx + 1}</h3>
                      {c.current_role && (
                        <p className="text-xs font-semibold text-amber-600 mt-1">
                          Current: {c.current_role}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-slate-400 mt-2">
                    {c.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>
                    )}
                    {c.years_experience !== undefined && c.years_experience !== null && (
                      <span>{c.years_experience}+ yrs experience</span>
                    )}
                  </div>
                  {c.skills && c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {c.skills.slice(0, 8).map(s => (
                        <span key={s} className="px-2.5 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                {c.resume_url && (
                  <button
                    onClick={() => handleResumeDownload(c)}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all flex-shrink-0"
                  >
                    <Download className="h-4 w-4" />
                    Resume
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeSearch;
