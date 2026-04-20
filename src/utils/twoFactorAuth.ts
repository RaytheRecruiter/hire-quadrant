import { supabase } from './supabaseClient';

/**
 * Two-Factor Authentication (2FA) utilities using TOTP
 * Uses time-based one-time passwords with QR codes for setup
 */

/**
 * Enable 2FA for current user
 * Returns secret and QR code for scanning with authenticator app
 */
export const enable2FA = async () => {
  try {
    // Call Supabase function to generate TOTP secret
    const { data, error } = await supabase.functions.invoke('enable-2fa');

    if (error) {
      throw error;
    }

    return {
      success: true,
      secret: data.secret,
      qrCodeUrl: data.qr_code_url, // Data URL for QR code
      manualEntryKey: data.manual_entry_key, // For manual entry
    };
  } catch (err) {
    console.error('Enable 2FA error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to enable 2FA',
    };
  }
};

/**
 * Verify 2FA setup with TOTP code
 * Must be called after enable2FA() to confirm the secret works
 */
export const verify2FASetup = async (secret: string, code: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-2fa-setup', {
      body: { secret, code },
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      backupCodes: data.backup_codes, // Array of single-use backup codes
    };
  } catch (err) {
    console.error('Verify 2FA setup error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid code',
    };
  }
};

/**
 * Verify TOTP code during login
 */
export const verify2FALogin = async (code: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-2fa-login', {
      body: { code },
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Verify 2FA login error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid code',
    };
  }
};

/**
 * Disable 2FA for current user
 */
export const disable2FA = async (password: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('disable-2fa', {
      body: { password },
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (err) {
    console.error('Disable 2FA error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to disable 2FA',
    };
  }
};

/**
 * Get backup codes for user (use if device is lost)
 */
export const getBackupCodes = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-backup-codes');

    if (error) {
      throw error;
    }

    return {
      success: true,
      backupCodes: data.backup_codes,
    };
  } catch (err) {
    console.error('Get backup codes error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get backup codes',
    };
  }
};

/**
 * Use a backup code (one-time use)
 */
export const useBackupCode = async (code: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('use-backup-code', {
      body: { code },
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      codesRemaining: data.codes_remaining,
    };
  } catch (err) {
    console.error('Use backup code error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid or expired backup code',
    };
  }
};

/**
 * Check if 2FA is enabled for current user
 */
export const check2FAStatus = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('check-2fa-status');

    if (error) {
      throw error;
    }

    return {
      success: true,
      enabled: data.enabled,
      backupCodesCount: data.backup_codes_count,
    };
  } catch (err) {
    console.error('Check 2FA status error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to check 2FA status',
    };
  }
};
