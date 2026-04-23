import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the hash
        const { data, error: authError } = await supabase.auth.getSession();

        if (authError) {
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!data.session) {
          setError('No session found. Please try signing in again.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userId = data.session.user.id;
        const userEmail = data.session.user.email || '';
        const metadata = data.session.user.user_metadata || {};

        // Check if profile exists
        const { data: profile, error: fetchError } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching profile:', fetchError);
        }

        // If profile doesn't exist, create it
        if (!profile) {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              name: metadata.name || userEmail,
              role: metadata.role || 'candidate'
            });

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            // Continue anyway - user is authenticated, just missing profile
          }
        }

        // Navigate to onboarding or profile
        if (profile) {
          navigate('/profile');
        } else {
          navigate('/onboarding');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('An error occurred. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">Completing sign-in...</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default AuthCallback;
