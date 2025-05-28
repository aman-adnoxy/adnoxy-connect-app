import { supabase } from './supabase';
import { Plan } from '@/types/plan';
import { Listing } from '@/types/listing';

export const planService = {
  async getPlans(userId: string): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plan')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  async addToPlan(userId: string, planId: string, listingId: string): Promise<void> {
    // Add listingId to the listings array of the plan
    const { error } = await supabase.rpc('add_listing_to_plan', { plan_id: planId, listing_id: listingId });
    if (error) throw error;
  },

  async createPlan(userId: string, name: string, listingId: string): Promise<Plan> {
    // Create a new plan with the first listing
    const { data, error } = await supabase
      .from('plan')
      .insert([
        {
          user_id: userId,
          name,
          listings: [listingId],
        }
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeFromPlan(userId: string, planId: string, listingId: string): Promise<void> {
    // Remove listingId from the listings array of the plan
    const { error } = await supabase.rpc('remove_listing_from_plan', { plan_id: planId, listing_id: listingId });
    if (error) throw error;
  },

  async deletePlan(userId: string, planId: string): Promise<void> {
    const { error } = await supabase
      .from('plan')
      .delete()
      .eq('user_id', userId)
      .eq('id', planId);
    if (error) throw error;
  },
}; 