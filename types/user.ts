export type Profile = {
  id: string;
  name?: string;
  email?: string;
  is_verified?: boolean;
  profile_picture_url?: string;
  phone?: string;
  created_at: string; // ISO date
  updated_at: string; // ISO date
};