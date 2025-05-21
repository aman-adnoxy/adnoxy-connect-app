import { useState, useEffect, useCallback } from 'react';
import { User, LoginCredentials, AuthResponse } from '@/types/auth';
import { authService } from '@/services/auth';
import { storage } from '@/services/storage';

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

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
  };
} 