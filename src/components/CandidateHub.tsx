import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Search,
  Calendar,
  Briefcase,
  UserCheck,
  Clock,
  TrendingUp,
  Award,
  FileText,
  Sparkles,
  Star,
  Shield,
  Loader2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Job, JobApplication } from '../contexts/JobContext';
import { supabase } from '../utils/supabaseClient';

interface Candidate {
  id: string;
  name: string;
  email: string;
  applications: JobApplication[];
  totalApplications: number;
  lastActivity: Date;
  status: string;
}

interface CandidateHubProps {
  candidates: Candidate[];
  applications: JobApplication[];
  jobs: Job[];
}

// Per Scott 2026-04-29 (#19): the candidate click-through view is privacy-first.
// We hide name/email/phone behind an anonymized handle and lead with skills /
// top skills / certifications so HQ can review candidates on merit before
// deciding to reveal contact info.
type CandidateProfile = {
  skills: string[];
  top_skills: string[];
  certifications: string[];
  current_title: string | null;
  years_experience: number | null;
  resume_parsed_at: string | null;
};

const anonHandle = (id: string) => `Candidate #${id.slice(-6).toUpperCase()}`;

const CandidateHub: React.FC<CandidateHubProps> = ({ candidates, applications, jobs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'lastActivity' | 'applications' | 'status'>('lastActivity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!selectedCandidate?.id) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    (async () => {
      const { data } = await supabase
        .from('candidates')
        .select('skills, top_skills, certifications, current_title, years_experience, resume_parsed_at')
        .eq('user_id', selectedCandidate.id)
        .maybeSingle();
      setProfile({
        skills: Array.isArray(data?.skills) ? (data!.skills as string[]) : [],
        top_skills: Array.isArray(data?.top_skills) ? (data!.top_skills as string[]) : [],
        certifications: Array.isArray(data?.certifications) ? (data!.certifications as string[]) : [],
        current_title: (data?.current_title as string | null) ?? null,
        years_experience: (data?.years_experience as number | null) ?? null,
        resume_parsed_at: (data?.resume_parsed_at as string | null) ?? null,
      });
      setProfileLoading(false);
    })();
  }, [selectedCandidate?.id]);

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || candidate.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'lastActivity':
          aValue = new Date(a.lastActivity);
          bValue = new Date(b.lastActivity);
          break;
        case 'applications':
          aValue = a.totalApplications;
          bValue = b.totalApplications;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [candidates, searchTerm, statusFilter, sortBy, sortOrder]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalCandidates = candidates.length;
    const activeCandidates = candidates.filter(c => 
      new Date(c.lastActivity) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length;
    const pendingApplications = applications.filter(app => app.status === 'pending').length;
    const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
    
    return {
      totalCandidates,
      activeCandidates,
      pendingApplications,
      acceptedApplications,
      conversionRate: totalCandidates > 0 ? ((acceptedApplications / applications.length) * 100).toFixed(1) : '0'
    };
  }, [candidates, applications]);

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCandidates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">Active (30 days)</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCandidates}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">Accepted</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.acceptedApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-slate-400">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search candidates (admin only — searches name/email behind the scenes)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
            >
              <option value="lastActivity-desc">Latest Activity</option>
              <option value="lastActivity-asc">Oldest Activity</option>
              <option value="applications-desc">Most Applications</option>
              <option value="applications-asc">Fewest Applications</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Grid — anonymized cards. Click a card to open the detail
          modal with skills / certifications / top skills. Names and emails
          are intentionally hidden here per Scott 2026-04-29 (#19). */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAndSortedCandidates.map((candidate) => (
          <div
            key={candidate.id}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-300 cursor-pointer"
            onClick={() => handleCandidateClick(candidate)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {anonHandle(candidate.id)}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Anonymized profile</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                {candidate.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                <Briefcase className="h-4 w-4 mr-2" />
                <span>{candidate.totalApplications} application{candidate.totalApplications !== 1 ? 's' : ''}</span>
              </div>

              <div className="flex items-center text-sm text-gray-600 dark:text-slate-400">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Last active {formatDistanceToNow(new Date(candidate.lastActivity), { addSuffix: true })}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end">
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                View skills →
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedCandidates.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No candidates found</h3>
          <p className="text-gray-500 dark:text-slate-400">Try adjusting your search criteria or filters.</p>
        </div>
      )}

      {/* Candidate Detail Modal — anonymized per Scott 2026-04-29 (#19).
          Reviewers see only skills, top skills, certifications, and high-level
          metadata. Name, email, and phone are intentionally hidden. */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-16 w-16">
                    <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                      <Shield className="h-7 w-7 text-primary-600" />
                    </div>
                  </div>
                  <div className="ml-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {anonHandle(selectedCandidate.id)}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 inline-flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Anonymized review — name, email, and phone are hidden until you message this candidate.
                    </p>
                    {profile?.current_title && (
                      <p className="text-sm text-gray-700 dark:text-slate-300 mt-2 font-medium">
                        {profile.current_title}
                        {profile.years_experience != null && ` · ${profile.years_experience} yrs`}
                      </p>
                    )}
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(selectedCandidate.status)}`}>
                      {selectedCandidate.status}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCandidateModal(false)}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {profileLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-6 w-6 text-primary-500 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Top Skills */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                        <Star className="h-5 w-5 text-amber-400" />
                        Top Skills
                      </h3>
                      {profile?.top_skills.length ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.top_skills.map((s) => (
                            <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-sm font-medium">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-slate-400">No top skills listed.</p>
                      )}
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                        Skills
                      </h3>
                      {profile?.skills.length ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.map((s) => (
                            <span key={s} className="inline-flex items-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-sm">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-slate-400">No skills listed.</p>
                      )}
                    </div>

                    {/* Certifications */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-violet-500" />
                        Certifications
                      </h3>
                      {profile?.certifications.length ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.certifications.map((c) => (
                            <span key={c} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-50 text-violet-800 border border-violet-200 text-sm">
                              <Award className="h-3 w-3" />
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-slate-400">No certifications listed.</p>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity</h3>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">Applications</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{selectedCandidate.totalApplications}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-slate-400">Last activity</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {format(new Date(selectedCandidate.lastActivity), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    {profile?.resume_parsed_at && (
                      <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-slate-400 inline-flex items-center gap-1">
                            <FileText className="h-3.5 w-3.5" /> Resume parsed
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDistanceToNow(new Date(profile.resume_parsed_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedCandidate.applications.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          Applications
                        </h4>
                        <ul className="space-y-2">
                          {selectedCandidate.applications.slice(0, 5).map((app) => {
                            const job = jobs.find(j => j.id === app.job_id);
                            return (
                              <li key={app.id} className="text-xs text-gray-600 dark:text-slate-400">
                                <div className="font-medium text-gray-800 dark:text-slate-200">{job ? job.title : 'Unknown Job'}</div>
                                <div className="flex items-center justify-between">
                                  <span>{job ? job.company : ''}</span>
                                  <span>{format(new Date(app.applied_at), 'MMM d')}</span>
                                </div>
                              </li>
                            );
                          })}
                          {selectedCandidate.applications.length > 5 && (
                            <li className="text-xs text-gray-500 dark:text-slate-400">
                              +{selectedCandidate.applications.length - 5} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateHub;