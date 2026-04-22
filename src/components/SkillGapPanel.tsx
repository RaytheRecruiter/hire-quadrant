import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  userSkills?: string[];
  missingSkills?: string[];
}

const SkillGapPanel: React.FC<Props> = ({ userSkills = [], missingSkills = [] }) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <h4 className="font-semibold text-secondary-900 dark:text-white">You Already Have</h4>
        </div>
        {userSkills && userSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {userSkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-secondary-600 dark:text-slate-400 italic">
            Add skills to your profile to see matches
          </p>
        )}
      </div>

      {missingSkills && missingSkills.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h4 className="font-semibold text-secondary-900 dark:text-white">You Need to Learn</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapPanel;
