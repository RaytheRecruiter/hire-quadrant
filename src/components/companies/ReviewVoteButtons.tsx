import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  reviewId: string;
  initialHelpful?: number;
  initialUnhelpful?: number;
  returnTo: string;
}

const ReviewVoteButtons: React.FC<Props> = ({ reviewId, initialHelpful = 0, initialUnhelpful = 0, returnTo }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [myVote, setMyVote] = useState<boolean | null>(null);
  const [helpful, setHelpful] = useState(initialHelpful);
  const [unhelpful, setUnhelpful] = useState(initialUnhelpful);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) { setMyVote(null); return; }
    (async () => {
      const { data } = await supabase
        .from('company_review_votes')
        .select('is_helpful')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setMyVote(data.is_helpful);
    })();
  }, [reviewId, user?.id]);

  const vote = async (next: boolean) => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (!user?.id) return;
    setLoading(true);

    // If clicking the same vote, retract it
    if (myVote === next) {
      const { error } = await supabase
        .from('company_review_votes')
        .delete()
        .eq('review_id', reviewId)
        .eq('user_id', user.id);
      if (!error) {
        setMyVote(null);
        if (next) setHelpful((n) => Math.max(0, n - 1));
        else setUnhelpful((n) => Math.max(0, n - 1));
      }
    } else {
      const prev = myVote;
      const { error } = await supabase
        .from('company_review_votes')
        .upsert(
          { review_id: reviewId, user_id: user.id, is_helpful: next },
          { onConflict: 'review_id,user_id' },
        );
      if (!error) {
        setMyVote(next);
        if (next) {
          setHelpful((n) => n + 1);
          if (prev === false) setUnhelpful((n) => Math.max(0, n - 1));
        } else {
          setUnhelpful((n) => n + 1);
          if (prev === true) setHelpful((n) => Math.max(0, n - 1));
        }
      } else {
        toast.error(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <button
        type="button"
        onClick={() => vote(true)}
        disabled={loading}
        aria-pressed={myVote === true}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${
          myVote === true
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
        }`}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        Helpful{helpful > 0 ? ` · ${helpful}` : ''}
      </button>
      <button
        type="button"
        onClick={() => vote(false)}
        disabled={loading}
        aria-pressed={myVote === false}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${
          myVote === false
            ? 'border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
        }`}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        Not helpful{unhelpful > 0 ? ` · ${unhelpful}` : ''}
      </button>
    </div>
  );
};

export default ReviewVoteButtons;
