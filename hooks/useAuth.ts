import { useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, AuthResponse } from '@/types/auth';
import { authService } from '@/services/auth';
import { storage } from '@/services/storage';
import { usersService } from '@/services/users';
import { User as SupabaseUser } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStoredAuth = useCallback(async () => {
    try {
      const storedUser = await storage.getUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (err) {
      console.error('Error loading stored auth:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await authService.signIn(credentials);
      if (response.error) {
        setError(response.error.message);
        return response;
      }
      setUser(response.user);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign in';
      setError(errorMessage);
      return { user: null, error: new Error(errorMessage) };
    }
  }, []);

  const signUp = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      setError(null);
      const response = await authService.signUp(credentials);
      if (response.error) {
        setError(response.error.message);
        return response;
      }
      setUser(response.user);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign up';
      setError(errorMessage);
      return { user: null, error: new Error(errorMessage) };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during sign out';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (user?.id) {
      try {
        const profileData = await usersService.getUserById(user.id);
        if (profileData) {
          // Construct a SupabaseUser object from the profile data
          const updatedUser: SupabaseUser = {
            ...user, // Keep existing SupabaseUser properties
            id: profileData.id,
            email: profileData.email,
            user_metadata: {
              ...user.user_metadata,
              name: profileData.name,
              phone_number: profileData.phone_number,
              other_details: profileData.other_details,
            },
            // Ensure other required SupabaseUser properties are present, even if empty
            app_metadata: user.app_metadata || {},
            aud: user.aud || '',
            created_at: profileData.created_at || user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            phone: profileData.phone_number, // SupabaseUser has a 'phone' field
            confirmed_at: user.confirmed_at,
            email_confirmed_at: user.email_confirmed_at,
            phone_confirmed_at: user.phone_confirmed_at,
            role: user.role,
            updated_at: profileData.updated_at || user.updated_at,
          };
          setUser(updatedUser);
        }
      } catch (err) {
        console.error('Error refreshing user data:', err);
      }
    }
  }, [user]);

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };
}
