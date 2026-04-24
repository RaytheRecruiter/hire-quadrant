import React, { useCallback, useEffect, useState } from 'react';
import { Share2, Copy, Check, Loader2, Mail, Twitter, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://hirequadrant.com';

const JobReferralShare: React.FC<Props> = ({ jobId, jobTitle, companyName }) => {
  const { user, isAuthenticated } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getOrCreateCode = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Reuse an existing non-expired referral for this user + job
    const { data: existing } = await supabase
      .from('job_referrals')
      .select('code, expires_at')
      .eq('job_id', jobId)
      .eq('referrer_id', user.id)
      .order('shared_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing && new Date(existing.expires_at) > new Date()) {
      setCode(existing.code);
      setLoading(false);
      return;
    }

    const { data: inserted, error } = await supabase
      .from('job_referrals')
      .insert({ job_id: jobId, referrer_id: user.id })
      .select('code')
      .single();

    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCode(inserted.code);
  }, [jobId, user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) getOrCreateCode();
  }, [isAuthenticated, user?.id, getOrCreateCode]);

  if (!isAuthenticated) {
    return (
      <section className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/40 rounded-xl p-4">
        <div className="flex items-start gap-2 mb-2">
          <Share2 className="h-4 w-4 text-primary-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
              Refer someone, earn a reward
            </h3>
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Sign in to get a unique share link — track if your referral gets hired.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const shareUrl = code ? `${ORIGIN}/jobs/${jobId}?ref=${code}` : '';
  const emailSubject = encodeURIComponent(`Job you might like: ${jobTitle} at ${companyName}`);
  const emailBody = encodeURIComponent(
    `Thought of you — this role looks like a fit:\n\n${jobTitle} at ${companyName}\n${shareUrl}\n\n(If you apply through this link, it's tracked as a referral from me.)`,
  );
  const twitterText = encodeURIComponent(`${jobTitle} at ${companyName} — thought this might be a fit`);
  const linkedinText = encodeURIComponent(`${jobTitle} at ${companyName}`);

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Share link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — long-press the link above');
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
      <div className="flex items-start gap-2 mb-3">
        <Share2 className="h-4 w-4 text-primary-500 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">
            Refer someone
          </h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Share this link — if they apply through it and get hired, you're credited as the referrer.
          </p>
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : !code ? null : (
        <>
          <div className="flex gap-2 mb-3">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 text-xs font-mono rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex gap-2">
            <a
              href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <Mail className="h-3 w-3" />
              Email
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <Twitter className="h-3 w-3" />
              X / Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${linkedinText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
            </a>
          </div>
        </>
      )}
    </section>
  );
};

export default JobReferralShare;
