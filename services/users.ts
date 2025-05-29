import { supabase } from './supabase';

export const usersService = {
  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, created_at')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  },

  async updateUser(userId: string, updates: { name?: string; other_details?: string }) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
};
