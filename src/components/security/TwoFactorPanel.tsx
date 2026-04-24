import React, { useEffect, useMemo, useState } from 'react';
import { Shield, ShieldCheck, Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import {
  generateBase32Secret,
  otpauthUri,
  verifyTotp,
  generateRecoveryCodes,
} from '../../utils/totp';

interface Factor {
  secret: string;
  verified: boolean;
  recovery_codes: string[] | null;
  enabled_at: string | null;
}

const TwoFactorPanel: React.FC = () => {
  const { user } = useAuth();
  const [factor, setFactor] = useState<Factor | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const otpauth = useMemo(() => {
    const secret = pendingSecret ?? factor?.secret ?? null;
    if (!secret || !user?.email) return null;
    return otpauthUri(secret, user.email);
  }, [pendingSecret, factor?.secret, user?.email]);

  const qrUrl = useMemo(() => {
    if (!otpauth) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauth)}&size=200x200`;
  }, [otpauth]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('user_mfa_factors')
        .select('secret, verified, recovery_codes, enabled_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) {
        setFactor((data as Factor) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const startSetup = () => {
    setPendingSecret(generateBase32Secret());
    setToken('');
  };

  const confirm = async () => {
    if (!pendingSecret || !user?.id) return;
    setVerifying(true);
    const ok = await verifyTotp(pendingSecret, token);
    if (!ok) {
      setVerifying(false);
      toast.error('That code didn\'t match. Try again in a few seconds.');
      return;
    }
    const recovery = generateRecoveryCodes();
    const { error } = await supabase.from('user_mfa_factors').upsert({
      user_id: user.id,
      secret: pendingSecret,
      verified: true,
      recovery_codes: recovery,
      enabled_at: new Date().toISOString(),
    });
    setVerifying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setFactor({ secret: pendingSecret, verified: true, recovery_codes: recovery, enabled_at: new Date().toISOString() });
    setPendingSecret(null);
    toast.success('Two-factor authentication enabled');
  };

  const disable = async () => {
    if (!user?.id) return;
    if (!window.confirm('Disable two-factor authentication? Your account will be less secure.')) return;
    await supabase.from('user_mfa_factors').delete().eq('user_id', user.id);
    setFactor(null);
    toast.success('Two-factor disabled');
  };

  const copyRecovery = async () => {
    if (!factor?.recovery_codes) return;
    await navigator.clipboard.writeText(factor.recovery_codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  const enabled = factor?.verified;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-3">
        {enabled ? (
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        ) : (
          <Shield className="h-4 w-4 text-gray-400" />
        )}
        <h2 className="text-sm font-semibold text-secondary-900 dark:text-white">
          Two-factor authentication
        </h2>
        {enabled && (
          <span className="text-[10px] uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
            On
          </span>
        )}
      </div>

      {enabled ? (
        <>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
            Your account is protected by an authenticator app. Keep your recovery codes somewhere safe.
          </p>
          {factor?.recovery_codes && (
            <div className="bg-gray-50 dark:bg-slate-900/40 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Recovery codes
                </span>
                <button
                  type="button"
                  onClick={copyRecovery}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy all'}
                </button>
              </div>
              <ul className="grid grid-cols-2 gap-1 text-xs font-mono text-gray-700 dark:text-slate-300">
                {factor.recovery_codes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={disable}
            className="text-xs text-rose-600 hover:text-rose-700"
          >
            Disable two-factor
          </button>
        </>
      ) : pendingSecret ? (
        <>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
            1. Scan this QR in your authenticator app (Google Authenticator, 1Password, Authy).
            2. Enter the 6-digit code it shows.
          </p>
          {qrUrl && (
            <img
              src={qrUrl}
              alt="TOTP QR code"
              className="w-44 h-44 mx-auto mb-3 rounded-lg border border-gray-100 dark:border-slate-700 bg-white"
            />
          )}
          <p className="text-[10px] text-center text-gray-500 dark:text-slate-400 font-mono mb-3 break-all">
            {pendingSecret}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="flex-1 text-center text-lg tracking-widest rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="button"
              onClick={confirm}
              disabled={verifying || token.length !== 6}
              className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 whitespace-nowrap"
            >
              {verifying && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm
            </button>
          </div>
          <button
            type="button"
            onClick={() => setPendingSecret(null)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
            Add an extra layer of security. Required for admin accounts.
          </p>
          <button
            type="button"
            onClick={startSetup}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-700 text-secondary-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Enable two-factor
          </button>
        </>
      )}
    </section>
  );
};

export default TwoFactorPanel;
