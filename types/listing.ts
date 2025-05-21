export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  city: string;
  image_urls: string[];
  price: number;
  category: string;
  availability_start?: string; // ISO date
  availability_end?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
};