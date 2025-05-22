import { supabase } from './supabase';
import { BookingRequest } from '@/types/booking';

export const bookingsService = {
  async getUserBookings(userId: string): Promise<BookingRequest[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      return data.map(booking => ({
        id: booking.id,
        user_id: booking.user_id,
        status: booking.status,
        total_price: booking.total_price,
        start_date: booking.start_date,
        end_date: booking.end_date,
        created_at: booking.created_at
      }));
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  async getListingBookings(listingId: string): Promise<BookingRequest[]> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('listing_id', listingId);

      if (error) throw error;

      return data.map(booking => ({
        id: booking.id,
        user_id: booking.user_id,
        status: booking.status,
        total_price: booking.total_price,
        start_date: booking.start_date,
        end_date: booking.end_date,
        created_at: booking.created_at
      }));
    } catch (error) {
      console.error('Error fetching listing bookings:', error);
      throw error;
    }
  },

  async createBooking(booking: Omit<BookingRequest, 'id' | 'created_at'>): Promise<BookingRequest> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...booking,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        user_id: data.user_id,
        status: data.status,
        total_price: data.total_price,
        start_date: data.start_date,
        end_date: data.end_date,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  async updateBookingStatus(id: string, status: BookingRequest['status']): Promise<BookingRequest> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        user_id: data.user_id,
        status: data.status,
        total_price: data.total_price,
        start_date: data.start_date,
        end_date: data.end_date,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }
}; 