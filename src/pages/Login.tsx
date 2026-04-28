import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { requestPasswordReset } from '../utils/passwordReset';
import { User, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  // Only honor returnTo values that stay on this origin — prevents open
  // redirect attacks via crafted ?returnTo=https://evil.com URLs.
  const safeReturnTo = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
    ? returnTo
    : null;
  const intent = searchParams.get('intent');
  const tab = searchParams.get('tab');
  const isForgotMode = tab === 'forgot';
  const registerHref = safeReturnTo
    ? `/register?returnTo=${encodeURIComponent(safeReturnTo)}${intent ? `&intent=${intent}` : ''}`
    : '/register';

  // Forgot-password (request-email) state — separate from sign-in form.
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotLoading(true);
    const result = await requestPasswordReset(forgotEmail);
    setForgotLoading(false);
    if (result.success) {
      setForgotSent(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Brute-force rate limit (8 failed attempts per 10 min per email).
      const { data: ok } = await supabase.rpc('check_auth_rate_limit', { p_email: email });
      if (ok === false) {
        setError('Too many failed attempts. Please wait a few minutes.');
        setLoading(false);
        return;
      }
      const result = await login(email, password);
      // Record attempt for rate-limiter window
      supabase.from('auth_attempts').insert({
        email: email.toLowerCase(),
        success: result.success,
      }).then(() => undefined);
      if (result.success) {
        if (safeReturnTo) {
          // Hard nav so the target page loads fresh with the new session
          // (matches HardLink pattern used elsewhere on the site).
          window.location.assign(safeReturnTo);
          return;
        }
        if (result.role === 'company') {
          navigate('/company-dashboard');
        } else if (result.role === 'admin') {
          navigate('/admin');
        } else {
          // Candidate — check if they need onboarding
          const { data: session } = await supabase.auth.getSession();
          const userId = session?.session?.user?.id;
          if (userId) {
            const { data: candidate } = await supabase
              .from('candidates')
              .select('location, headline, resume_url')
              .eq('user_id', userId)
              .maybeSingle();
            const hasBasics = candidate && (candidate.location || candidate.headline || candidate.resume_url);
            navigate(hasBasics ? '/' : '/onboarding');
          } else {
            navigate('/');
          }
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          {intent === 'apply' && (
            <div className="mb-4 mx-auto max-w-sm bg-primary-50 border border-primary-200 text-primary-900 text-sm rounded-xl px-4 py-3 text-center">
              Sign in to finish submitting your application. New here? <HardLink to={registerHref} className="font-semibold underline">Create an account</HardLink> — it takes under a minute.
            </div>
          )}
          <h2 className="mt-6 text-center text-4xl font-bold text-secondary-900 dark:text-white">
            {isForgotMode ? 'Reset your password' : 'Sign in to your account'}
          </h2>
          <p className="mt-4 text-center text-gray-600 dark:text-slate-400">
            {isForgotMode ? (
              <>
                Remembered it?{' '}
                <HardLink to="/login" className="font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-300">
                  Back to sign in
                </HardLink>
              </>
            ) : (
              <>
                Or{' '}
                <HardLink to={registerHref} className="font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-300">
                  create a new account
                </HardLink>
              </>
            )}
          </p>
        </div>

        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700">
          {isForgotMode ? (
            forgotSent ? (
              <div className="text-center space-y-4">
                <Mail className="mx-auto h-12 w-12 text-primary-500" />
                <h3 className="text-xl font-semibold text-secondary-900 dark:text-white">Check your email</h3>
                <p className="text-gray-600 dark:text-slate-400">
                  We sent a password reset link to <span className="font-semibold">{forgotEmail}</span>. The link expires in 1 hour.
                </p>
                <HardLink to="/login" className="inline-block mt-4 font-semibold text-primary-500 hover:text-primary-600">
                  Back to sign in
                </HardLink>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleForgotSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl font-medium">{error}</div>
                )}
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Enter your account email and we'll send you a link to set a new password.
                </p>
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">
                    Email address
                  </label>
                  <div className="mt-1 relative">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-300 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 sm:text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="group relative w-full flex justify-center py-4 px-6 border border-transparent font-semibold rounded-xl text-white bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )
          ) : (
          <>
          <GoogleSignInButton label="Continue with Google" />

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">
                Email address
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-300 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200">
                  Password
                </label>
                <HardLink
                  to="/login?tab=forgot"
                  className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-300"
                >
                  Forgot?
                </HardLink>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-12 py-4 border border-gray-200 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-300 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400 transition-colors duration-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent font-semibold rounded-xl text-white bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;