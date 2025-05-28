export type Profile = {
  id: string;
  name?: string;
  email?: string;
  is_verified?: boolean;
  profile_picture_url?: string;
  phone_number?: string;
  other_details?: string;
  created_at: string; // ISO date
  updated_at?: string; // ISO date
};
