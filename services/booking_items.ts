import { supabase } from './supabase';
import { BookingItem } from '@/types/booking_items';

export const bookingItemsService = {
  async getBookingItems(bookingId: string): Promise<BookingItem[]> {
    try {
      const { data, error } = await supabase
        .from('booking_items')
        .select('*')
        .eq('booking_id', bookingId);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        booking_id: item.booking_id,
        listing_id: item.listing_id,
        proposed_price: item.proposed_price,
        proposed_dates: item.proposed_dates,
        notes: item.notes
      }));
    } catch (error) {
      console.error('Error fetching booking items:', error);
      throw error;
    }
  },

  async getBookingItem(id: string): Promise<BookingItem> {
    try {
      const { data, error } = await supabase
        .from('booking_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        booking_id: data.booking_id,
        listing_id: data.listing_id,
        proposed_price: data.proposed_price,
        proposed_dates: data.proposed_dates,
        notes: data.notes
      };
    } catch (error) {
      console.error('Error fetching booking item:', error);
      throw error;
    }
  },

  async createBookingItem(item: Omit<BookingItem, 'id'>): Promise<BookingItem> {
    try {
      const { data, error } = await supabase
        .from('booking_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        booking_id: data.booking_id,
        listing_id: data.listing_id,
        proposed_price: data.proposed_price,
        proposed_dates: data.proposed_dates,
        notes: data.notes
      };
    } catch (error) {
      console.error('Error creating booking item:', error);
      throw error;
    }
  },

  async updateBookingItem(id: string, updates: Partial<Omit<BookingItem, 'id' | 'booking_id' | 'listing_id'>>): Promise<BookingItem> {
    try {
      const { data, error } = await supabase
        .from('booking_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        booking_id: data.booking_id,
        listing_id: data.listing_id,
        proposed_price: data.proposed_price,
        proposed_dates: data.proposed_dates,
        notes: data.notes
      };
    } catch (error) {
      console.error('Error updating booking item:', error);
      throw error;
    }
  },

  async deleteBookingItem(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('booking_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting booking item:', error);
      throw error;
    }
  },

  async getListingBookingItems(listingId: string): Promise<BookingItem[]> {
    try {
      const { data, error } = await supabase
        .from('booking_items')
        .select('*')
        .eq('listing_id', listingId);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        booking_id: item.booking_id,
        listing_id: item.listing_id,
        proposed_price: item.proposed_price,
        proposed_dates: item.proposed_dates,
        notes: item.notes
      }));
    } catch (error) {
      console.error('Error fetching listing booking items:', error);
      throw error;
    }
  }
};
