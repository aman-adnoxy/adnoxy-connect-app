export interface Listing {
  id: string;
  listing_source_id: string; 
  user_id: string;
  title: string;
  height: number; 
  width: number;
  unit: string;
  size?: string; // Added size field
  lighting_type?: 'Digital' | 'BL' | 'FL' | 'NL';
  quantity?: number | string; // Updated type to allow string
  description?: string;
  latitude: number;
  longitude: number;
  google_location: string;
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
  street?: string;
  area?: string;
  landmark?: string;
  representative_name?: string;
  contact_no?: string;
  alternate_contact_no?: string | null;
  supporting_documents?: string[]; // New field for supporting documents
  is_unavailable?: boolean; // New field to indicate unavailability
};

export interface ListingForDb extends Omit<Listing, 'created_at'> {
  // All other fields from Listing are included, and 'created_at' is omitted for DB insertion
  // The 'id' field is now expected to be provided by the client (the generated UUID)
}
