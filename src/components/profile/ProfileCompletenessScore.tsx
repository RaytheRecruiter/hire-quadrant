import React, { useMemo } from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';

export interface ProfileCompletenessInputs {
  hasName: boolean;
  hasTopSkills: boolean;
  hasAvatar: boolean;
  hasResume: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasPreferences: boolean;
}

// Per Scott 2026-04-29: "Professional headline" is gone; "Top Skills" took
// its slot in profile completeness as the primary discoverability signal.
const CRITERIA: Array<{ key: keyof ProfileCompletenessInputs; label: string; weight: number }> = [
  { key: 'hasName', label: 'Full name', weight: 5 },
  { key: 'hasTopSkills', label: 'Top skills', weight: 10 },
  { key: 'hasAvatar', label: 'Profile photo', weight: 10 },
  { key: 'hasResume', label: 'Resume uploaded', weight: 20 },
  { key: 'hasExperience', label: 'Work experience', weight: 20 },
  { key: 'hasEducation', label: 'Education', weight: 10 },
  { key: 'hasSkills', label: 'Skills', weight: 15 },
  { key: 'hasPreferences', label: 'Job preferences', weight: 10 },
];

const ProfileCompletenessScore: React.FC<{ inputs: ProfileCompletenessInputs }> = ({ inputs }) => {
  const { score, next } = useMemo(() => {
    let earned = 0;
    let nextMissing: string | null = null;
    for (const c of CRITERIA) {
      if (inputs[c.key]) {
        earned += c.weight;
      } else if (!nextMissing) {
        nextMissing = c.label;
      }
    }
    return { score: Math.min(100, earned), next: nextMissing };
  }, [inputs]);

  const tone =
    score >= 90 ? 'bg-emerald-500'
    : score >= 60 ? 'bg-primary-500'
    : score >= 30 ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary-500" />
          <span className="text-sm font-semibold text-secondary-900 dark:text-white">
            Profile strength
          </span>
        </div>
        <span className="text-sm font-bold text-secondary-900 dark:text-white">{score}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${tone} transition-all`}
          style={{ width: `${score}%` }}
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
        />
      </div>
      {next ? (
        <p className="text-xs text-gray-600 dark:text-slate-400">
          Next step: <span className="font-medium text-secondary-900 dark:text-white">{next}</span>
        </p>
      ) : (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Profile complete — you'll show up in more recruiter searches.
        </p>
      )}
      <ul className="mt-3 grid grid-cols-2 gap-1.5">
        {CRITERIA.map((c) => {
          const done = inputs[c.key];
          const Icon = done ? CheckCircle2 : Circle;
          return (
            <li
              key={c.key}
              className={`flex items-center gap-1.5 text-xs ${
                done
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-slate-500'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProfileCompletenessScore;
