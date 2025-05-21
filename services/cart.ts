import { supabase } from './supabase';
import { Cart, CartItem } from '@/types/cart';
import { Listing } from '@/types/listing';

export const cartService = {
  async getCartItems(userId: string): Promise<(Listing & { start_date: Date; end_date: Date; added_at: string })[]> {
    const { data, error } = await supabase
      .from('cart')
      .select(`
        *,
        listing:listings(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => ({
      ...item.listing,
      start_date: new Date(item.start_date),
      end_date: new Date(item.end_date),
      added_at: item.added_at
    }));
  },

  async addToCart(userId: string, listingId: string, start_date: Date, end_date: Date): Promise<void> {
    const { error } = await supabase
      .from('cart')
      .insert([
        {
          user_id: userId,
          listing_id: listingId,
          start_date: start_date.toISOString(),
          end_date: end_date.toISOString(),
          added_at: new Date().toISOString()
        }
      ]);

    if (error) throw error;
  },

  async isInCart(user_id: string, listing_id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('cart')
      .select('listing_id')
      .eq('user_id', user_id)
      .eq('listing_id', listing_id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // ignore "No rows found"
    return !!data;
  },

  async removeFromCart(userId: string, listingId: string): Promise<void> {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) throw error;
  },

  async clearCart(userId: string): Promise<void> {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
};