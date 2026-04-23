import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GraduationCap, Search, ChevronDown, Flame, ThumbsUp, AlertCircle, MapPin, DollarSign, Clock } from 'lucide-react';
import { useCareerPaths } from '../hooks/useCareerPaths';
import { useJobs } from '../contexts/JobContext';

interface ExpandedNode {
  role: string;
  index: number;
}

export default function CareerPath() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchRole, setSearchRole] = useState(searchParams.get('from') || '');
  const [expandedNode, setExpandedNode] = useState<ExpandedNode | null>(null);
  const { jobs } = useJobs();

  const currentRole = searchRole || searchParams.get('from') || '';
  const { paths, loading } = useCareerPaths(currentRole);

  const getMatchIcon = (label: 'high' | 'medium' | 'low') => {
    switch (label) {
      case 'high': return <Flame className="h-4 w-4 text-orange-500" />;
      case 'medium': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'low': return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getMatchLabel = (label: 'high' | 'medium' | 'low') => {
    switch (label) {
      case 'high': return 'High Match';
      case 'medium': return 'Medium Match';
      case 'low': return 'Low Match';
    }
  };

  // Find related jobs for each path
  const pathsWithJobs = useMemo(() => {
    if (!paths || !jobs) return paths;
    return paths.map(path => ({
      ...path,
      relatedJobs: jobs.filter(j =>
        j.title.toLowerCase().includes(path.role.toLowerCase()) ||
        path.role.toLowerCase().includes(j.title.toLowerCase())
      ).slice(0, 3),
    }));
  }, [paths, jobs]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-24 md:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <GraduationCap className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white">Build Your Career Path</h1>
            <p className="text-secondary-600 dark:text-slate-400 mt-1">Explore where your current role can lead</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter your current job title (e.g., Frontend Engineer)"
              value={searchRole}
              onChange={(e) => setSearchRole(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-secondary-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && searchRole && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500">Generating career paths...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && (!searchRole || paths.length === 0) && (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-slate-400">
              {searchRole ? 'No career paths found. Try a different role.' : 'Enter a job title to explore career opportunities.'}
            </p>
          </div>
        )}

        {/* Career Paths Timeline */}
        {!loading && searchRole && pathsWithJobs.length > 0 && (
          <div className="space-y-4">
            {pathsWithJobs.map((path, idx) => (
              <div key={idx} className="relative">
                {/* Connector line */}
                {idx < pathsWithJobs.length - 1 && (
                  <div className="absolute left-8 top-24 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 to-gray-200 dark:from-primary-700 dark:to-slate-700" />
                )}

                {/* Path Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Timeline dot */}
                      <div className="mt-0.5">
                        <div className="h-4 w-4 rounded-full bg-primary-500 shadow-lg" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-secondary-900 dark:text-white">{path.role}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            +${(path.salary_delta_low / 1000).toFixed(0)}k – +${(path.salary_delta_high / 1000).toFixed(0)}k
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {path.time_to_transition}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Match Badge */}
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 flex-shrink-0">
                      {getMatchIcon(path.match_label)}
                      <span>{getMatchLabel(path.match_label)}</span>
                    </div>
                  </div>

                  {/* Skill Transfer Bar */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-gray-700 dark:text-slate-300">Skill Transfer</span>
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">{path.skill_transfer_pct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-primary-400 to-primary-500 h-2 rounded-full transition-all"
                        style={{ width: `${path.skill_transfer_pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Expandable Content */}
                  <button
                    onClick={() => setExpandedNode(expandedNode?.index === idx ? null : { role: path.role, index: idx })}
                    className="w-full flex items-center justify-between py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium transition-colors"
                  >
                    <span>Details</span>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform ${expandedNode?.index === idx ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {expandedNode?.index === idx && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-4">
                      {/* Missing Skills */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">You'll Need to Learn</h4>
                        <div className="flex flex-wrap gap-2">
                          {path.missing_skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-300 text-xs font-medium rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Related Jobs */}
                      {path.relatedJobs && path.relatedJobs.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Hiring Now</h4>
                          <div className="space-y-2">
                            {path.relatedJobs.map(job => (
                              <button
                                key={job.id}
                                onClick={() => navigate(`/jobs/${job.id}`)}
                                className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 transition-colors"
                              >
                                <p className="font-medium text-secondary-900 dark:text-white text-sm">{job.title}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-slate-400">
                                  <span>{job.company}</span>
                                  {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
