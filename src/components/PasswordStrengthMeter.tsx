import React from 'react';
import { scorePassword } from '../utils/passwordStrength';

interface Props {
  password: string;
  className?: string;
}

const PasswordStrengthMeter: React.FC<Props> = ({ password, className = '' }) => {
  const s = scorePassword(password);
  if (!password) return null;
  const pct = ((s.score + 1) / 5) * 100;

  return (
    <div className={`mt-1 ${className}`}>
      <div className="h-1.5 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${s.color} transition-all`}
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-600 dark:text-slate-400">{s.label}</span>
        {s.hints.length > 0 && (
          <span className="text-xs text-gray-500 dark:text-slate-500 text-right">
            {s.hints[0]}
          </span>
        )}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
