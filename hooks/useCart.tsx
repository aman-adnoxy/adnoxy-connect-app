import { createContext, useContext, useEffect, useState } from 'react';
import { cartService } from '@/services/cart';
import { useAuth } from './useAuth';
import { CartItem } from '@/types/cart';
import { Listing } from '@/types/listing';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeFromCart: (listingId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  isInCart: (listingId: string) => Promise<boolean>;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadCartItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadCartItems = async () => {
    try {
      if (!user?.id) {
        setItems([]);
        return;
      }
      setLoading(true);
      const cartItems = await cartService.getCartItems(user.id);
      // Transform listings into CartItems with proper null checks
      const transformedItems: CartItem[] = cartItems
        .filter(listing => listing && listing.id) // Filter out any null/undefined listings
        .map(listing => ({
          user_id: user.id,
          listing_id: listing.id,
          start_date: new Date(listing.start_date || new Date()),
          end_date: new Date(listing.end_date || new Date()),
          added_at: new Date().toISOString(),
          notes: '' // Default empty notes
        }));
      setItems(transformedItems);
    } catch (error) {
      console.error('Error loading cart items:', error);
      setItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };
  
  const addToCart = async (item: Omit<CartItem, 'id'>) => {
    try {
      if (!user?.id) throw new Error('User must be logged in to add to cart');
      await cartService.addToCart(user.id, item.listing_id, item.start_date, item.end_date);
      await loadCartItems(); // Reload cart items to get the full state
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (listingId: string) => {
    try {
      if (!user?.id) throw new Error('User must be logged in to remove from cart');
      await cartService.removeFromCart(user.id, listingId);
      setItems(prev => prev.filter(item => item.listing_id !== listingId));
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      if (!user?.id) throw new Error('User must be logged in to clear cart');
      await cartService.clearCart(user.id);
      setItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  };

  const isInCart = async (listingId: string) => {
    try {
      if (!user?.id) return false;
      return await cartService.isInCart(user.id, listingId);
    } catch (error) {
      console.error('Error checking if item is in cart:', error);
      return false;
    }
  };

  return (
    <CartContext.Provider value={{ items, loading, addToCart, removeFromCart, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}