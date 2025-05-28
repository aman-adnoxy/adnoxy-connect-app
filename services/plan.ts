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

  async getPlan(userId: string, planId: string): Promise<Plan> {
    const { data, error } = await supabase
      .from('plan')
      .select('*')
      .eq('user_id', userId)
      .eq('id', planId)
      .single();
    if (error) throw error;
    return data;
  },

  async addToPlan(userId: string, planId: string, listingId: string): Promise<void> {
    // First verify the plan belongs to the user
    const { data: plan, error: fetchError } = await supabase
      .from('plan')
      .select('listings')
      .eq('id', planId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;
    if (!plan) throw new Error('Plan not found');

    // Check if listing is already in the plan
    if (plan.listings.includes(listingId)) {
      throw new Error('This listing is already in your plan');
    }

    // Add listingId to the listings array
    const updatedListings = [...plan.listings, listingId];
    
    const { error: updateError } = await supabase
      .from('plan')
      .update({ listings: updatedListings })
      .eq('id', planId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
  },

  async createPlan(userId: string, name: string, listingId?: string, startDate?: string, endDate?: string): Promise<Plan> {
    // Create a new plan, optionally with the first listing
    const listings = listingId ? [listingId] : [];
    const { data, error } = await supabase
      .from('plan')
      .insert([
        {
          user_id: userId,
          name,
          listings,
          start_date: startDate,
          end_date: endDate,
        }
      ])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePlanDates(userId: string, planId: string, startDate: string, endDate: string): Promise<void> {
    const { error } = await supabase
      .from('plan')
      .update({ start_date: startDate, end_date: endDate })
      .eq('id', planId)
      .eq('user_id', userId);
    if (error) throw error;
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