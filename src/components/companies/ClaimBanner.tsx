import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  companySlug: string;
  companyName: string;
  emailDomain: string | null;
}

const ClaimBanner: React.FC<Props> = ({ companySlug, companyName, emailDomain }) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    if (!isAuthenticated) {
      navigate(`/login?returnTo=/companies/${companySlug}`);
      return;
    }

    setClaiming(true);
    const { data, error } = await supabase.rpc('claim_company', { target_slug: companySlug });
    setClaiming(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const result = data as { success?: boolean; error?: string; required_domain?: string };
    if (!result?.success) {
      if (result?.error === 'email_domain_mismatch') {
        toast.error(
          `Your account email must be @${result.required_domain} to claim this company.`,
          { duration: 7000 },
        );
      } else if (result?.error === 'not_authenticated') {
        navigate(`/login?returnTo=/companies/${companySlug}`);
      } else {
        toast.error(`Claim failed: ${result?.error ?? 'unknown error'}`);
      }
      return;
    }

    toast.success(`You now manage ${companyName}`);
    navigate('/company-dashboard');
  };

  const domainHint = emailDomain
    ? `Verification requires an email ending in @${emailDomain}`
    : user?.email
    ? `Claiming will bind this page to the @${user.email.split('@')[1]} domain`
    : 'Sign in with a company email to claim';

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-2xl p-5 md:p-6 shadow-md">
      <div className="flex items-start gap-4 flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-lg p-2.5 flex-shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Is this your company?</h3>
            <p className="text-sm text-white/90 mt-0.5">
              Claim this page to respond to reviews, edit your profile, and see analytics.
            </p>
            <p className="text-xs text-white/70 mt-1">{domainHint}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClaim}
          disabled={claiming}
          className="inline-flex items-center gap-2 bg-white text-primary-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-70 whitespace-nowrap"
        >
          {claiming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Claim this page
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ClaimBanner;
