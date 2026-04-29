// Accept-invite page. Phase 1 MVP per Scott 2026-04-29 (#4).
// /accept-invite?token=X → looks up the invite, requires sign-in (or sign-up
// using the invite email), then calls accept_company_invite RPC.

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, Shield, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_LABEL } from '../utils/permissions';

type InviteSummary = {
  id: string;
  company_id: string;
  email: string;
  role: 'admin' | 'standard';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
};

type CompanyName = { display_name: string | null; name: string };

const AcceptInvite: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [invite, setInvite] = useState<InviteSummary | null>(null);
  const [company, setCompany] = useState<CompanyName | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token');
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('company_invitations')
        .select('id, company_id, email, role, status, expires_at')
        .eq('token', token)
        .maybeSingle();
      if (error || !data) {
        setError('Invitation not found or has been revoked.');
        setLoading(false);
        return;
      }
      const inv = data as InviteSummary;
      if (inv.status !== 'pending') {
        setError(`This invitation is ${inv.status}.`);
        setInvite(inv);
        setLoading(false);
        return;
      }
      if (new Date(inv.expires_at) < new Date()) {
        setError('This invitation has expired.');
        setInvite(inv);
        setLoading(false);
        return;
      }
      setInvite(inv);
      const { data: companyRow } = await supabase
        .from('companies')
        .select('display_name, name')
        .eq('id', inv.company_id)
        .maybeSingle();
      if (companyRow) setCompany(companyRow as CompanyName);
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      // Send to signup with the invite email pre-filled, then bounce back.
      navigate(
        `/signup?email=${encodeURIComponent(invite!.email)}&next=/accept-invite?token=${token}`,
      );
      return;
    }
    setAccepting(true);
    const { error } = await supabase.rpc('accept_company_invite', { p_token: token });
    setAccepting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Welcome to the team');
    navigate('/company-dashboard');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Invitation</h1>
        </div>

        {error ? (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="text-rose-900 font-medium">Invitation unavailable</p>
              <p className="text-sm text-rose-800 mt-1">{error}</p>
            </div>
          </div>
        ) : invite ? (
          <>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              You've been invited to join{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {company?.display_name || company?.name || 'this company'}
              </span>{' '}
              as a{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {ROLE_LABEL[invite.role]}
              </span>
              .
            </p>
            <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Email</span>
                <span className="text-gray-900 dark:text-white font-medium">{invite.email}</span>
              </div>
              {user && user.email?.toLowerCase() !== invite.email.toLowerCase() && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  You're signed in as <strong>{user.email}</strong> — this invite is for{' '}
                  <strong>{invite.email}</strong>. Sign out and use the invited email to accept.
                </div>
              )}
            </div>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 font-medium"
            >
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {user ? 'Accept invitation' : 'Sign up to accept'}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AcceptInvite;
