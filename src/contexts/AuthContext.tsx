import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'admin' | 'company';
  companyId?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string, role?: 'candidate' | 'company') => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'role' | 'companyId'>>) => Promise<boolean>;
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

  // Fetch user profile from user_profiles table
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available');
      return null;
    }

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('name, role, company_id, created_at')
        .eq('id', supabaseUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: profile.name,
        role: profile.role,
        companyId: profile.company_id,
        createdAt: new Date(profile.created_at)
      };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available, falling back to localStorage auth');
      // Fallback to localStorage for development
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
      return;
    }

    // Get initial session
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          setUser(userProfile);
          setSession(session);
        } else {
          setUser(null);
          setSession(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available, falling back to localStorage auth');
      // Fallback to localStorage for development
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check for admin user
      if (email === 'admin@hirequadrant.com' && password === 'admin123') {
        const adminUser: User = {
          id: 'admin',
          email: 'admin@hirequadrant.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: new Date()
        };
        setUser(adminUser);
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        return true;
      }

      // Check for regular users
      const existingUser = users.find((u: any) => u.email === email && u.password === password);
      if (existingUser) {
        const userToSet: User = {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: 'candidate',
          createdAt: new Date(existingUser.createdAt)
        };
        setUser(userToSet);
        localStorage.setItem('currentUser', JSON.stringify(userToSet));
        return true;
      }

      return false;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error.message);
        return false;
      }

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user);
        if (userProfile) {
          setUser(userProfile);
          setSession(data.session);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    name: string, 
    role: 'candidate' | 'company' = 'candidate'
  ): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available, falling back to localStorage auth');
      // Fallback to localStorage for development
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if user already exists
      if (users.find((u: any) => u.email === email)) {
        return false;
      }

      const newUser = {
        id: Date.now().toString(),
        email,
        password,
        name,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      const userToSet: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: 'candidate',
        createdAt: new Date(newUser.createdAt)
      };

      setUser(userToSet);
      localStorage.setItem('currentUser', JSON.stringify(userToSet));
      return true;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          }
        }
      });

      if (error) {
        console.error('Registration error:', error.message);
        return false;
      }

      if (data.user) {
        // The user profile will be created automatically by the trigger
        // If email confirmation is disabled, the user will be logged in immediately
        if (data.session) {
          const userProfile = await fetchUserProfile(data.user);
          if (userProfile) {
            setUser(userProfile);
            setSession(data.session);
          }
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // Fallback to localStorage for development
      setUser(null);
      localStorage.removeItem('currentUser');
      return;
    }

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
  };

  const updateProfile = async (updates: Partial<Pick<User, 'name' | 'role' | 'companyId'>>): Promise<boolean> => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      return false;
    }

    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.role !== undefined) updateData.role = updates.role;
      if (updates.companyId !== undefined) updateData.company_id = updates.companyId;

      const { error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error.message);
        return false;
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};