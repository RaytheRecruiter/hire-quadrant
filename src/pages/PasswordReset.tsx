import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { confirmPasswordReset, validatePassword } from '../utils/passwordReset';

const PasswordReset: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.valid) {
      toast.error('Password does not meet requirements');
      return;
    }

    setLoading(true);
    const result = await confirmPasswordReset(password);

    if (result.success) {
      toast.success(result.message);
      redirectTimer.current = setTimeout(() => navigate('/profile'), 2000);
    } else {
      toast.error(result.error || 'Failed to reset password');
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Reset Password — HireQuadrant</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
            <Link to="/login" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 text-sm font-medium mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>

            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>

            <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
              Create New Password
            </h1>
            <p className="text-gray-600 dark:text-slate-400 mb-8">
              Enter a strong password to secure your account.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-600 dark:text-slate-400">Password must contain:</p>
                  <ul className="space-y-1 text-xs text-gray-500 dark:text-slate-500">
                    <li className={password.length >= 8 ? 'text-green-600' : ''}>
                      ✓ At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                      ✓ One uppercase letter (A-Z)
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                      ✓ One lowercase letter (a-z)
                    </li>
                    <li className={/[0-9]/.test(password) ? 'text-green-600' : ''}>
                      ✓ One number (0-9)
                    </li>
                    <li className={/[!@#$%^&*]/.test(password) ? 'text-green-600' : ''}>
                      ✓ One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary-800 dark:text-white mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-900 text-secondary-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-2">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || passwordErrors.length > 0}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>

            <p className="text-xs text-gray-500 dark:text-slate-500 text-center mt-6">
              If the reset link has expired, <Link to="/login?tab=forgot" className="text-primary-600 hover:underline">request a new one</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PasswordReset;
