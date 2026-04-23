import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

// Shows a banner if a candidate is missing key profile fields (resume, location, headline).
// Dismissal is persisted per session via sessionStorage. Re-checks fire on user change
// or when a 'profile-updated' event is dispatched by ProfilePage after a save.
const ProfileNudge: React.FC = () => {
  const { user, isCompany, isAdmin } = useAuth();
  const [missing, setMissing] = useState<string[] | null>(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('profile-nudge-dismissed') === 'true');

  const check = useCallback(async () => {
    if (!user || isCompany || isAdmin || dismissed) {
      setMissing([]);
      return;
    }
    const { data } = await supabase
      .from('candidates')
      .select('resume_url, location, phone_number, headline')
      .eq('user_id', user.id)
      .maybeSingle();

    const gaps: string[] = [];
    if (!data?.resume_url) gaps.push('resume');
    if (!data?.location) gaps.push('location');
    if (!data?.headline) gaps.push('headline');
    setMissing(gaps);
  }, [user, isCompany, isAdmin, dismissed]);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    const handler = () => {
      check();
    };
    window.addEventListener('profile-updated', handler);
    return () => window.removeEventListener('profile-updated', handler);
  }, [check]);

  if (!user || isCompany || isAdmin || dismissed || missing === null || missing.length === 0) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('profile-nudge-dismissed', 'true');
    setDismissed(true);
  };

  const completion = Math.round(((3 - missing.length) / 3) * 100);

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
            <span className="text-sm text-primary-800 ml-1 hidden sm:inline">
              Add a {missing.slice(0, 2).join(' and ')} so employers can find you.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            to="/profile"
            className="text-sm font-semibold bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg shadow-soft transition-all"
          >
            Complete profile
          </Link>
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
