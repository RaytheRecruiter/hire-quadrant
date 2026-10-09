import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfileCompleteness } from '../hooks/useProfileCompleteness';
import { computeProfileScore } from './profile/ProfileCompletenessScore';

// Shows a banner if a candidate's profile isn't 100% complete per the same
// weighted formula used everywhere else (see computeProfileScore). Used to
// run its own narrower 3-field check (resume/location/top skills, equally
// weighted) that could show a completely different percentage than the
// "Profile strength" widget elsewhere for the exact same profile --
// confirmed live 2026-10-09 (audit N16) as a real, confusing discrepancy.
// Dismissal is persisted per session via sessionStorage.
const ProfileNudge: React.FC = () => {
  const { user, isCompany, isAdmin } = useAuth();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('profile-nudge-dismissed') === 'true');
  const { inputs, loading } = useProfileCompleteness();
  const { score: completion, next } = computeProfileScore(inputs);

  if (!user || isCompany || isAdmin || dismissed || loading || completion >= 100) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('profile-nudge-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="relative bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 border-b border-primary-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-1.5 bg-white rounded-lg flex-shrink-0 shadow-soft">
            <Sparkles className="h-4 w-4 text-primary-600" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-primary-900">
              Your profile is {completion}% complete.
            </span>
            {next && (
              <span className="text-sm text-primary-800 ml-1 hidden sm:inline">
                Add {next.toLowerCase()} so employers can find you.
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="/profile"
            onClick={(e) => {
              // Bypass React Router's delegated click handler. Some intercept
              // on prod is rewriting the target of SPA navigation; forcing a
              // full page load gets the user to ProfilePage reliably.
              e.preventDefault();
              window.location.assign('/profile');
            }}
            className="text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg shadow-soft transition-all"
          >
            Complete profile
          </a>
          <button
            onClick={handleDismiss}
            className="h-7 w-7 flex items-center justify-center rounded-md text-primary-700 hover:bg-primary-200"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileNudge;
