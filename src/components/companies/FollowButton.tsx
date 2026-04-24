import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCompanyFollow } from '../../hooks/useCompanyFollow';

interface Props {
  companyId: string | null | undefined;
  companySlug: string;
  className?: string;
}

const FollowButton: React.FC<Props> = ({ companyId, companySlug, className = '' }) => {
  const { isAuthenticated } = useAuth();
  const { following, followerCount, toggle, loading } = useCompanyFollow(companyId);
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/companies/${companySlug}`);
      return;
    }
    await toggle();
  };

  const label = following ? 'Following' : 'Follow';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={following}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors disabled:opacity-60 ${
        following
          ? 'bg-primary-600 border-primary-600 text-white hover:bg-primary-700'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${following ? 'fill-white' : ''}`} />
      )}
      <span className="text-sm font-medium">{label}</span>
      {followerCount > 0 && (
        <span className={`text-xs ${following ? 'text-white/90' : 'text-gray-500 dark:text-slate-400'}`}>
          · {followerCount}
        </span>
      )}
    </button>
  );
};

export default FollowButton;
