import { supabase } from './supabaseClient';
import { sendPasswordReset } from './emailService';

/**
 * Request password reset
 * Sends email with reset link to user
 */
export const requestPasswordReset = async (email: string) => {
  try {
    // Supabase handles sending the reset email if email recovery is enabled
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Password reset request error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: 'Check your email for a password reset link',
    };
  } catch (err) {
    console.error('Password reset error:', err);
    return { success: false, error: 'Failed to send reset email' };
  }
};

/**
 * Confirm password reset with new password
 * Called after user clicks reset link and enters new password
 */
export const confirmPasswordReset = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (err) {
    console.error('Password update error:', err);
    return { success: false, error: 'Failed to update password' };
  }
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must include at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must include at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must include at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must include at least one special character (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
