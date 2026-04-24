import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import HardLink from '../components/HardLink';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Mail, Eye, EyeOff, CheckCircle, Briefcase, Building2 } from 'lucide-react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { checkPasswordBreach } from '../utils/hibp';

const Register: React.FC = () => {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const safeReturnTo = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;
  const intent = searchParams.get('intent');
  const loginHref = safeReturnTo
    ? `/login?returnTo=${encodeURIComponent(safeReturnTo)}${intent ? `&intent=${intent}` : ''}`
    : '/login';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'candidate' | 'company'>('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // bots auto-fill; humans never see it
  const formMountedAt = React.useRef(Date.now());
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Anti-spam gates — silent reject so bots don't adapt
    if (honeypot.trim() !== '') return;
    if (Date.now() - formMountedAt.current < 2500) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Have I Been Pwned k-anonymity check — blocks known-breached passwords.
    const breach = await checkPasswordBreach(password);
    if (breach.breached) {
      setError(
        `This password has appeared in ${breach.count.toLocaleString()} known data breaches. Please choose a different one.`,
      );
      return;
    }

    setLoading(true);

    try {
      const success = await register(email, password, name, userType);
      if (success) {
        setRegistered(true);
      } else {
        setError('Email already exists. Please use a different email.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show confirmation page after successful registration
  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/20 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
              Check Your Email
            </h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              We've sent a confirmation link to <strong>{email}</strong>. Please check your inbox and click the link to verify your account.
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
              Didn't receive the email? Check your spam folder or try registering again.
            </p>
            <HardLink
              to={loginHref}
              className="inline-block bg-gradient-to-r from-primary-400 to-primary-500 text-white px-8 py-3 rounded-xl font-semibold hover:from-primary-500 hover:to-primary-600 transition-all duration-300 shadow-lg"
            >
              Go to Login
            </HardLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-4xl font-bold text-secondary-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-4 text-center text-gray-600 dark:text-slate-400">
            Or{' '}
            <HardLink
              to={loginHref}
              className="font-semibold text-primary-500 hover:text-primary-600 transition-colors duration-300"
            >
              sign in to your existing account
            </HardLink>
          </p>
        </div>

        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700">
          <GoogleSignInButton role={userType} label="Sign up with Google" />

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
              <label className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('candidate')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    userType === 'candidate'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50'
                  }`}
                >
                  <Briefcase className={`h-6 w-6 ${userType === 'candidate' ? 'text-primary-500' : 'text-gray-400 dark:text-slate-500'}`} />
                  <span className="text-sm font-semibold">Job Seeker</span>
                  <span className="text-xs opacity-70">Find your next role</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('company')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    userType === 'company'
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-md'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50/50 text-gray-600 dark:text-slate-400 hover:border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:bg-slate-900/50'
                  }`}
                >
                  <Building2 className={`h-6 w-6 ${userType === 'company' ? 'text-primary-500' : 'text-gray-400 dark:text-slate-500'}`} />
                  <span className="text-sm font-semibold">Employer</span>
                  <span className="text-xs opacity-70">Post jobs & hire</span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">
                Full Name
              </label>
              <div className="mt-1 relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-300 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">
                Email address
              </label>
              <div className="mt-1 relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-4 py-4 border border-gray-200 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-300 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">
                Password
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-12 py-4 border border-gray-200 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-300 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800"
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400 transition-colors duration-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Honeypot — hidden from humans, bots auto-fill and get silently dropped */}
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] opacity-0 pointer-events-none"
            />

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-secondary-800 dark:text-slate-200 mb-2">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-slate-500" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-12 py-4 border border-gray-200 dark:border-slate-700 placeholder-gray-500 dark:placeholder-slate-500 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-300 bg-gray-50/50 hover:bg-white dark:bg-slate-800 focus:bg-white dark:bg-slate-800"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-400 transition-colors duration-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent font-semibold rounded-xl text-white bg-gradient-to-r from-primary-400 to-primary-500 hover:from-primary-500 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
