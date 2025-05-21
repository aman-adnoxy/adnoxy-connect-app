import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types/auth';

const STORAGE_KEYS = {
  USER: '@user',
  TOKENS: '@tokens',
};

export const storage = {
  async saveUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  async getUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  async saveTokens(tokens: { access_token: string; refresh_token: string }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  },

  async getTokens(): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
      const tokensJson = await AsyncStorage.getItem(STORAGE_KEYS.TOKENS);
      return tokensJson ? JSON.parse(tokensJson) : null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  },

  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKENS]);
    } catch (error) {
      console.error('Error clearing auth:', error);
      throw error;
    }
  },
}; 