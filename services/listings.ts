import { supabase } from './supabase';
import { Listing } from '@/types/listing';

export const listingsService = {
  async getListings(filters?: { category?: string; search?: string }): Promise<Listing[]> {
    try {
      let query = supabase
        .from('listings')
        .select('*');

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Listing[];
    } catch (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }
  },

  async getListingById(id: string): Promise<Listing> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Listing;
    } catch (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }
  },

  async createListing(listing: Omit<Listing, 'id' | 'created_at'>): Promise<Listing> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .insert([listing])
        .select()
        .single();

      if (error) throw error;
      return data as Listing;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  },

  async updateListing(id: string, listing: Partial<Listing>): Promise<Listing> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .update(listing)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Listing;
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  },

  async deleteListing(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  },

  async getUserListings(userId: string): Promise<Listing[]> {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data as Listing[];
    } catch (error) {
      console.error('Error fetching user listings:', error);
      throw error;
    }
  },

  async getListingsLocationsAndPrices(city?: string): Promise<Listing[]> {
    try {
      let query = supabase
        .from('listings')
        .select('*'); // Select all fields to get full Listing objects

      if (city) {
        query = query.ilike('city', `%${city}%`); // Filter by city if provided
      }

      const { data, error } = await query;
      if (error) throw error;

      // Data should now conform to Listing[] directly
      return data as Listing[];
    } catch (error) {
      console.error('Error fetching listing locations and prices:', error);
      throw error;
    }
  }
};
