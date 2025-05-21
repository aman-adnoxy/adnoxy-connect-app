import { supabase } from './supabase';
import { LoginCredentials, AuthResponse, User } from '@/types/auth';
import { storage } from './storage';

export const authService = {
  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        await storage.saveTokens({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        await storage.saveUser(data.user);
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Failed to sign in'),
      };
    }
  },
  async signUp(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          emailRedirectTo: 'adnoxy-connect://auth/confirmation'
        }
      });

      if (error) throw error;

      // Check if user needs to confirm their email
      if (data.user?.identities?.length === 0) {
        throw new Error('Please check your email for a confirmation link');
      }

      if (data.session && data.user) {
        await storage.saveTokens({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        await storage.saveUser(data.user);
      }

      return {
        user: data.user,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Failed to sign up'),
      };
    }
  },

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await storage.clearAuth();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  async refreshSession(): Promise<void> {
    try {
      const tokens = await storage.getTokens();
      if (!tokens?.refresh_token) throw new Error('No refresh token found');

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: tokens.refresh_token,
      });

      if (error) throw error;

      if (data.session && data.user) {
        await storage.saveTokens({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        await storage.saveUser(data.user);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  },
}; 