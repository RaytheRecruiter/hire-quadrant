import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'admin' | 'company';
  companyId?: string;
  avatarUrl?: string | null;
  isApproved: boolean;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  register: (email: string, password: string, name: string, role?: 'candidate' | 'company') => Promise<boolean>;
  loginWithGoogle: (role?: 'candidate' | 'company') => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  isCompany: boolean;
  loading: boolean;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'role' | 'companyId' | 'avatarUrl'>>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isHandlingLogin = useRef(false);

  // Fetch user profile from user_profiles table
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('name, role, company_id, is_approved, created_at')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!profile) {
        console.warn(`No user_profiles row for auth user ${supabaseUser.id}`);
        return null;
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile.name,
        role: profile.role,
        companyId: profile.company_id,
        avatarUrl: profile.avatar_url ?? null,
        isApproved: profile.is_approved ?? true,
        createdAt: new Date(profile.created_at)
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setLoading(false);
          return;
        }

        if (initialSession?.user) {
          const userProfile = await fetchUserProfile(initialSession.user);
          setUser(userProfile);
          setSession(initialSession);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    // IMPORTANT: Do not make async Supabase calls inside this callback
    // as it can cause deadlocks with the auth token refresh cycle.
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          setSession(session);
          // Defer the profile fetch to avoid blocking the auth state change
          // Skip if login() is already handling it to avoid duplicate fetch
          setTimeout(async () => {
            if (!isMounted || isHandlingLogin.current) return;
            const userProfile = await fetchUserProfile(session.user);
            if (isMounted) {
              setUser(userProfile);
              setLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; role?: string }> => {
    try {
      isHandlingLogin.current = true;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error.message);
        isHandlingLogin.current = false;
        return { success: false };
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user);
        if (userProfile) {
          setUser(userProfile);
          setSession(data.session);
          isHandlingLogin.current = false;
          return { success: true, role: userProfile.role };
        }
      }

      isHandlingLogin.current = false;
      return { success: false };
    } catch (error) {
      console.error('Login error:', error);
      isHandlingLogin.current = false;
      return { success: false };
    }
  }, []);

  const register = useCallback(async (
    email: string, 
    password: string, 
    name: string, 
    role: 'candidate' | 'company' = 'candidate'
  ): Promise<boolean> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          },
          emailRedirectTo: window.location.origin + '/auth/callback'
        }
      });

      if (authError) {
        console.error('Registration error:', authError.message);
        return false;
      }
      
      const user = authData?.user;
      
      if (!user) {
        console.log('Success! Please check your email to confirm your account.');
        return true;
      }

      const userProfile = await fetchUserProfile(user);
      if (userProfile) {
        setUser(userProfile);
        setSession(authData.session);
      }

      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  }, []);

  const loginWithGoogle = useCallback(async (role: 'candidate' | 'company' = 'candidate'): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // role is passed so the trigger can set it when creating user_profiles
          // Note: Supabase only persists this via raw_user_meta_data on signup
          scopes: 'email profile',
        },
      });

      if (error) {
        console.error('Google OAuth error:', error.message);
        throw error;
      }
      // The browser will redirect to Google, so nothing else to do here
    } catch (error) {
      console.error('loginWithGoogle error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
      }
      
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'name' | 'role' | 'companyId' | 'avatarUrl'>>): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.companyId !== undefined) updateData.company_id = updates.companyId;
      if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error.message);
        return false;
      }

      setUser(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  }, [user]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    session,
    login,
    register,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isApproved: user?.isApproved ?? true,
    isCompany: user?.role === 'company',
    loading,
    updateProfile
  }), [user, session, loading, login, register, loginWithGoogle, logout, updateProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};