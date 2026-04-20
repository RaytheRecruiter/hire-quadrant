import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export const useOAuth = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    if (error) console.error('Google sign-in error:', error);
  };

  const handleGitHubSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error('GitHub sign-in error:', error);
  };

  const handleLinkedInSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error('LinkedIn sign-in error:', error);
  };

  // Handle OAuth callback redirect
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash.includes('access_token')) {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          navigate('/login?error=auth_failed');
          return;
        }
        // Successfully authenticated
        navigate('/profile');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return {
    handleGoogleSignIn,
    handleGitHubSignIn,
    handleLinkedInSignIn,
  };
};
