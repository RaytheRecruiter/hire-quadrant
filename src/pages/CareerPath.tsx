import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { GraduationCap, ChevronDown, ArrowRight, Loader2, Search } from 'lucide-react';
import { useCareerPaths } from '../hooks/useCareerPaths';
import { useJobs } from '../contexts/JobContext';
import SkillGapPanel from '../components/SkillGapPanel';

interface CareerStep {
  role: string;
  skill_transfer_pct: number;
  salary_delta_low: number;
  salary_delta_high: number;
  time_to_transition: string;
  missing_skills: string[];
  match_label: 'high' | 'medium' | 'low';
  depth: number;
}

const CareerPath: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { jobs } = useJobs();

  const [currentRole, setCurrentRole] = useState<string>(searchParams.get('from') || '');
  const [steps, setSteps] = useState<CareerStep[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { paths, loading } = useCareerPaths(currentRole);

  // Unique role titles from jobs for autocomplete
  const roleOptions = useMemo(() => {
    const unique = new Set<string>();
    jobs.forEach(job => {
      unique.add(job.title);
    });
    return Array.from(unique).sort();
  }, [jobs]);

  // Build career progression chain
  useEffect(() => {
    if (paths.length > 0) {
      const newSteps: CareerStep[] = paths.map((path, i) => ({
        ...path,
        depth: i + 1,
      }));
      setSteps(newSteps);
    }
  }, [paths]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentRole(value);

    if (value.length > 0) {
      const filtered = roleOptions.filter(role =>
        role.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectRole = (role: string) => {
    setCurrentRole(role);
    navigate(`?from=${encodeURIComponent(role)}`);
    setShowSuggestions(false);
    setExpandedStep(null);
  };

  const jobsForRole = (role: string) => {
    return jobs.filter(job =>
      job.title.toLowerCase().includes(role.toLowerCase())
    ).slice(0, 3);
  };

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-4">
              Build Your Career Path
            </h1>
            <p className="text-lg text-secondary-600 dark:text-slate-400">
              Explore where your next role could take you
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for your current role..."
                value={currentRole}
                onChange={handleRoleChange}
                onFocus={() => setShowSuggestions(currentRole.length > 0)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 dark:bg-slate-700 dark:text-white"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg z-10">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => selectRole(suggestion)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-600 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setCurrentRole('')}
          className="inline-flex items-center gap-2 text-secondary-600 hover:text-primary-600 font-medium mb-6 text-sm transition-colors"
        >
          ← Change role
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            <GraduationCap className="inline mr-3 h-8 w-8 text-amber-500" />
            {currentRole}
          </h1>
          <p className="text-secondary-600 dark:text-slate-400">
            Discover your career progression
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : steps.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-8 text-center">
            <p className="text-secondary-600 dark:text-slate-400">
              No career paths available for this role
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index}>
                {/* Step Node */}
                <button
                  onClick={() => setExpandedStep(expandedStep === index ? null : index)}
                  className="w-full bg-white dark:bg-slate-800 rounded-xl shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-slate-700 overflow-hidden text-left"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-secondary-900 dark:text-white mb-2">
                          {step.role}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-secondary-600 dark:text-slate-400">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            step.match_label === 'high'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : step.match_label === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          }`}>
                            {step.skill_transfer_pct}% skill transfer
                          </span>
                          <span className="font-semibold">
                            +${(step.salary_delta_low / 1000).toFixed(0)}K–${(step.salary_delta_high / 1000).toFixed(0)}K
                          </span>
                          <span className="text-xs text-gray-500">{step.time_to_transition}</span>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 transition-transform flex-shrink-0 ${
                          expandedStep === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedStep === index && (
                    <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-6 space-y-6">
                      <SkillGapPanel missingSkills={step.missing_skills} />

                      {/* Jobs for this role */}
                      {jobsForRole(step.role).length > 0 && (
                        <div>
                          <h4 className="font-semibold text-secondary-900 dark:text-white mb-3">
                            Jobs hiring for {step.role}
                          </h4>
                          <div className="space-y-2">
                            {jobsForRole(step.role).map(job => (
                              <a
                                key={job.id}
                                href={`/jobs/${job.id}`}
                                className="block p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                              >
                                <div className="font-medium text-secondary-900 dark:text-white">
                                  {job.title}
                                </div>
                                <div className="text-sm text-secondary-600 dark:text-slate-400">
                                  {job.company} • {job.location}
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </button>

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="h-5 w-5 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerPath;
