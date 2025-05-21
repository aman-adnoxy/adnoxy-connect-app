import { supabase } from './supabase';
import { Wishlist } from '@/types/wishlist';
import { Listing } from '@/types/listing';

export const wishlistService = {
  async getWishlistItems(userId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        *,
        listing:listings(*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => item.listing);
  },

  async addToWishlist(userId: string, listingId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist')
      .insert([
        {
          user_id: userId,
          listing_id: listingId,
        }
      ]);

    if (error) throw error;
  },

  async removeFromWishlist(userId: string, listingId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) throw error;
  },

  async clearWishlist(userId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}; 