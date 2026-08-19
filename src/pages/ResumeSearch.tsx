import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Search, MapPin, User, Loader2, Download, Filter, Lock, KeyRound, CheckCircle2, SlidersHorizontal, DollarSign, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { geocode } from '../utils/geocode';

const WORKPLACE_OPTIONS = ['Remote', 'Hybrid', 'On-site'];
const WORK_TYPE_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Contract-to-hire', 'Internship', 'Temporary'];
const AUTH_OPTIONS = [
  'Authorized to work in the US',
  'Need H-1B sponsorship',
  'Need other visa sponsorship',
  'Prefer not to say',
];
const INDUSTRY_OPTIONS = [
  'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education',
  'Government', 'Nonprofit', 'Hospitality', 'Construction', 'Transportation & Logistics',
  'Media & Entertainment', 'Professional Services', 'Energy', 'Real Estate',
];
const RADIUS_OPTIONS = [10, 25, 50, 100, 250];

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
  current_title?: string;
  certifications?: string[];
  resume_parsed_at?: string;
  desired_salary_min?: number | null;
  desired_salary_max?: number | null;
  work_authorization?: string | null;
  workplace_types?: string[] | null;
  work_types?: string[] | null;
  distance_miles?: number | null;
}

interface UnlocksInfo {
  total: number;
  used: number;
  remaining: number;
  purchased_remaining: number;
  period_start: string;
}

const ResumeSearch: React.FC = () => {
  const { isCompany, isAdmin, loading: authLoading } = useAuth();
  const { isOwner, isAdmin: isCompanyAdmin, can, member, loading: permLoading } = usePermissions();
  // Per Scott 2026-04-29 Phase 2: Database Search is a paid feature. Owner +
  // Company Admin always have it; Standard users need search_candidates
  // explicitly granted. Legacy single-tenant users (no member row) keep
  // access via the noMember fallback.
  const noMember = !member;
  const canSearch = noMember || isOwner || isCompanyAdmin || can('search_candidates');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [minYears, setMinYears] = useState<number>(0);
  const [titleFilter, setTitleFilter] = useState('');
  const [updatedWithinDays, setUpdatedWithinDays] = useState<number>(0);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [workAuth, setWorkAuth] = useState('');
  const [degree, setDegree] = useState('');
  const [workplaceTypes, setWorkplaceTypes] = useState<string[]>([]);
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [distanceLocation, setDistanceLocation] = useState('');
  const [distanceMiles, setDistanceMiles] = useState<number>(0);
  const [geocoding, setGeocoding] = useState(false);

  const toggleMulti = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };
  // Unlock credit state. Phase 2 #5: candidate contact + resume download
  // are gated by per-period credits. Already-unlocked candidates stay
  // visible to the whole company for the rest of the period.
  const [unlocks, setUnlocks] = useState<UnlocksInfo | null>(null);
  const [unlockedSet, setUnlockedSet] = useState<Set<string>>(new Set());
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const fetchCandidates = async () => {
    setLoading(true);

    let lat: number | null = null;
    let lng: number | null = null;
    if (distanceLocation.trim() && distanceMiles > 0) {
      setGeocoding(true);
      const result = await geocode(distanceLocation.trim());
      setGeocoding(false);
      if (result) {
        lat = result.lat;
        lng = result.lng;
      } else {
        toast.error('Could not find that location — distance filter skipped.');
      }
    }

    const since = updatedWithinDays > 0
      ? new Date(Date.now() - updatedWithinDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: candidateData, error } = await supabase.rpc('search_candidates', {
      p_query: query || null,
      p_location: location || null,
      p_min_years: minYears > 0 ? minYears : null,
      p_title: titleFilter || null,
      p_updated_since: since,
      p_min_salary: minSalary ? Number(minSalary) : null,
      p_max_salary: maxSalary ? Number(maxSalary) : null,
      p_work_authorization: workAuth || null,
      p_workplace_types: workplaceTypes.length > 0 ? workplaceTypes : null,
      p_work_types: workTypes.length > 0 ? workTypes : null,
      p_industries: industries.length > 0 ? industries : null,
      p_degree: degree || null,
      p_lat: lat,
      p_lng: lng,
      p_miles: lat && lng ? distanceMiles : null,
    });

    if (!error && candidateData) {
      // Fetch career settings for all candidates
      const userIds = candidateData.map((c: Candidate) => c.user_id);
      const { data: careerData } = await supabase
        .from('user_career_settings')
        .select('user_id, current_role, target_role')
        .in('user_id', userIds);

      // Merge career settings into candidates
      const careerMap = new Map((careerData || []).map(c => [c.user_id, c]));
      const enriched = candidateData.map((c: Candidate) => ({
        ...c,
        ...(careerMap.get(c.user_id) || {}),
      }));

      setCandidates(enriched);
    } else if (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull credit allowance + already-unlocked candidate ids whenever the
  // member's company changes. Both queries are scoped by RLS.
  const refreshUnlocks = async () => {
    if (!member?.company_id) {
      setUnlocks(null);
      setUnlockedSet(new Set());
      return;
    }
    const [{ data: remaining }, { data: rows }] = await Promise.all([
      supabase.rpc('unlocks_remaining', { p_company_id: member.company_id }),
      supabase
        .from('candidate_unlocks')
        .select('candidate_user_id, period_start')
        .eq('company_id', member.company_id)
        .order('period_start', { ascending: false }),
    ]);
    if (Array.isArray(remaining) && remaining.length > 0) {
      setUnlocks(remaining[0] as UnlocksInfo);
    } else if (remaining && typeof remaining === 'object') {
      setUnlocks(remaining as unknown as UnlocksInfo);
    }
    // Filter unlocks to those in the current period (RLS+RPC use the same
    // logic but the table is unfiltered).
    const periodStart =
      Array.isArray(remaining) && remaining.length > 0
        ? new Date((remaining[0] as UnlocksInfo).period_start)
        : null;
    const ids = (rows || [])
      .filter((r) => !periodStart || new Date(r.period_start) >= periodStart)
      .map((r) => r.candidate_user_id as string);
    setUnlockedSet(new Set(ids));
  };

  useEffect(() => {
    refreshUnlocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.company_id]);

  const handleResumeDownload = async (candidate: Candidate) => {
    if (!candidate.resume_url) return toast.error('No resume uploaded.');
    const { data, error } = await supabase.storage
      .from('resumes')
      .createSignedUrl(candidate.resume_url, 3600);
    if (error) return toast.error('Could not generate download link.');
    window.open(data.signedUrl, '_blank');
  };

  const handleUnlock = async (candidate: Candidate) => {
    if (!candidate.user_id) return;
    setUnlockingId(candidate.user_id);
    const { data, error } = await supabase.rpc('unlock_candidate', {
      p_candidate_user_id: candidate.user_id,
    });
    setUnlockingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = Array.isArray(data) ? data[0] : data;
    setUnlockedSet((s) => new Set([...s, candidate.user_id!]));
    if (result?.already_unlocked) {
      toast.success('Already unlocked this period');
    } else {
      toast.success('Contact info unlocked');
    }
    refreshUnlocks();
  };

  if (authLoading || permLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
  }

  if (!isCompany && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (!canSearch) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl border border-amber-200 shadow-md p-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Database Search restricted</h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                Resume Database is a paid feature on your company plan. Ask your
                Owner or Admin to grant you the "Search the candidate database"
                permission, or upgrade your subscription.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-secondary-900 to-secondary-700 bg-clip-text text-transparent">
              Resume Database
            </h1>
            <p className="mt-2 text-gray-600 dark:text-slate-400">Search candidates open to new opportunities.</p>
          </div>
          {unlocks && (
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <KeyRound className="h-4 w-4 text-amber-500" />
                <span>Unlock credits</span>
              </div>
              <div className="mt-1 text-base font-semibold text-secondary-900 dark:text-white">
                {unlocks.remaining} <span className="text-gray-400 dark:text-slate-500 font-normal">/ {unlocks.total} remaining</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Resets each billing period
                {unlocks.purchased_remaining > 0 && ` · +${unlocks.purchased_remaining} purchased`}
              </div>
            </div>
          )}
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
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Current job title"
                value={titleFilter}
                onChange={e => setTitleFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
            <div className="relative md:col-span-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
              <select
                value={updatedWithinDays}
                onChange={e => setUpdatedWithinDays(Number(e.target.value))}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none"
              >
                <option value="0">Any time profile updated</option>
                <option value="30">Updated in last 30 days</option>
                <option value="90">Updated in last 90 days</option>
                <option value="180">Updated in last 6 months</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchCandidates}
              disabled={geocoding}
              className="bg-gradient-to-r from-primary-400 to-primary-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all disabled:opacity-60"
            >
              {geocoding ? 'Locating…' : 'Search'}
            </button>
            <button
              type="button"
              onClick={() => setShowMoreFilters((s) => !s)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-slate-400 hover:text-primary-600"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showMoreFilters ? 'Hide more filters' : 'More filters'}
            </button>
          </div>

          {showMoreFilters && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-slate-700 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="number"
                    placeholder="Min desired salary"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="number"
                    placeholder="Max desired salary"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <select
                  value={workAuth}
                  onChange={(e) => setWorkAuth(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none"
                >
                  <option value="">Any work authorization</option>
                  {AUTH_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Degree (e.g. Bachelor's)"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
                  <input
                    type="text"
                    placeholder="Distance from city or ZIP"
                    value={distanceLocation}
                    onChange={(e) => setDistanceLocation(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <select
                  value={distanceMiles}
                  onChange={(e) => setDistanceMiles(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 appearance-none"
                >
                  <option value={0}>No radius</option>
                  {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>Within {r} miles</option>)}
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Workplace</span>
                <div className="flex flex-wrap gap-2">
                  {WORKPLACE_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleMulti(setWorkplaceTypes, o)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        workplaceTypes.includes(o) ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Employment type</span>
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPE_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleMulti(setWorkTypes, o)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        workTypes.includes(o) ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1.5">Industry</span>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRY_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => toggleMulti(setIndustries, o)}
                      className={`px-3 py-1 rounded-full text-xs transition-colors ${
                        industries.includes(o) ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
            {candidates.map((c, idx) => {
              const isUnlocked = c.user_id ? unlockedSet.has(c.user_id) : false;
              const noCredits = unlocks ? unlocks.remaining <= 0 && unlocks.purchased_remaining <= 0 : false;
              return (
                <div key={c.user_id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        isUnlocked ? 'bg-emerald-100' : 'bg-primary-100'
                      }`}>
                        {isUnlocked ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <span className="font-bold text-primary-600">#</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary-900 dark:text-white">
                          {isUnlocked && c.name ? c.name : `Candidate ${idx + 1}`}
                        </h3>
                        {isUnlocked && c.email && (
                          <p className="text-xs text-gray-500 dark:text-slate-400">{c.email}</p>
                        )}
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
                      {c.distance_miles != null && (
                        <span className="flex items-center gap-1"><Navigation className="h-3 w-3" />{Math.round(c.distance_miles)} mi away</span>
                      )}
                      {(c.desired_salary_min || c.desired_salary_max) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {c.desired_salary_min ? `$${(c.desired_salary_min / 1000).toFixed(0)}k` : '—'}
                          {' – '}
                          {c.desired_salary_max ? `$${(c.desired_salary_max / 1000).toFixed(0)}k` : '—'}
                        </span>
                      )}
                    </div>
                    {(c.workplace_types?.length || c.work_types?.length || c.work_authorization) && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {c.workplace_types?.map((w) => (
                          <span key={w} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px]">{w}</span>
                        ))}
                        {c.work_types?.map((w) => (
                          <span key={w} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px]">{w}</span>
                        ))}
                        {c.work_authorization && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px]">{c.work_authorization}</span>
                        )}
                      </div>
                    )}
                    {c.skills && c.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {c.skills.slice(0, 8).map(s => (
                          <span key={s} className="px-2.5 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    {isUnlocked ? (
                      c.resume_url ? (
                        <button
                          onClick={() => handleResumeDownload(c)}
                          className="flex items-center gap-2 bg-gradient-to-r from-primary-400 to-primary-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all"
                        >
                          <Download className="h-4 w-4" />
                          Resume
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-slate-500 italic">No resume</span>
                      )
                    ) : (
                      <button
                        onClick={() => handleUnlock(c)}
                        disabled={unlockingId === c.user_id || (noCredits && !isUnlocked)}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        title={noCredits ? 'No unlock credits remaining this period' : 'Unlock contact info + resume (1 credit)'}
                      >
                        {unlockingId === c.user_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <KeyRound className="h-4 w-4" />
                        )}
                        {noCredits ? 'No credits' : 'Unlock'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeSearch;
