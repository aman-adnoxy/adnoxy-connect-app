import { User as SupabaseUser } from '@supabase/supabase-js';
import { Profile } from './user';

export type User = SupabaseUser & Profile;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User | null;
  error: Error | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signUp: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

export interface RefreshTokenResponse {
  accessToken: string;
}
