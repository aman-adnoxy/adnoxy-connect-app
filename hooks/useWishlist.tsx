import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Listing } from '@/types/listing';
import { wishlistService } from '@/services/wishlist';
import { useAuth } from '@/contexts/AuthContext';

interface WishlistContextType {
  items: Listing[];
  loading: boolean;
  error: string | null;
  addToWishlist: (listing: Listing) => Promise<void>;
  removeFromWishlist: (listingId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadWishlistItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const wishlistItems = await wishlistService.getWishlistItems(user.id);
      setItems(wishlistItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wishlist items');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWishlistItems();
  }, [loadWishlistItems]);

  const addToWishlist = useCallback(async (listing: Listing) => {
    if (!user) {
      throw new Error('You must be logged in to add items to wishlist');
    }

    try {
      setError(null);
      await wishlistService.addToWishlist(user.id, listing.id);
      setItems(prev => [...prev, listing]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item to wishlist');
      throw err;
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (listingId: string) => {
    if (!user) {
      throw new Error('You must be logged in to remove items from wishlist');
    }

    try {
      setError(null);
      await wishlistService.removeFromWishlist(user.id, listingId);
      setItems(prev => prev.filter(item => item.id !== listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove item from wishlist');
      throw err;
    }
  }, [user]);

  const clearWishlist = useCallback(async () => {
    if (!user) {
      throw new Error('You must be logged in to clear wishlist');
    }

    try {
      setError(null);
      await wishlistService.clearWishlist(user.id);
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear wishlist');
      throw err;
    }
  }, [user]);

  const refreshWishlist = useCallback(async () => {
    await loadWishlistItems();
  }, [loadWishlistItems]);

  return (
    <WishlistContext.Provider value={{
      items,
      loading,
      error,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      refreshWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}