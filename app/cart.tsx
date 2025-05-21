import { StyleSheet, Pressable, View as RNView, Alert, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import { CartItem } from '@/types/cart';
import { Stack } from 'expo-router';

export default function CartScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { items = [], removeFromCart, clearCart, loading } = useCart();
  const { user } = useAuth();
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [loadingListings, setLoadingListings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    if (!items || items.length === 0) {
      setListings({});
      setLoadingListings(false);
      return;
    }

    try {
      setLoadingListings(true);
      setError(null);
      
      const listingDetails = await Promise.all(
        items.map(item => 
          listingsService.getListingById(item.listing_id)
            .catch(err => {
              console.error(`Error loading listing ${item.listing_id}:`, err);
              return null;
            })
        )
      );

      const listingsMap = listingDetails.reduce((acc, listing) => {
        if (listing && listing.id) {
          acc[listing.id] = listing;
        }
        return acc;
      }, {} as Record<string, Listing>);

      setListings(listingsMap);
    } catch (error) {
      console.error('Error loading listings:', error);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoadingListings(false);
    }
  }, [items]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[Typography.h2, styles.title, isDark && styles.darkTitle]}>
          Please sign in to view your cart
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: tintColor },
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (loading || loadingListings) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer, isDark && styles.darkContainer]}>
        <ActivityIndicator size="large" color={tintColor} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.errorContainer}>
          <FontAwesome name="exclamation-circle" size={48} color={isDark ? '#888' : '#bbb'} />
          <Text style={[Typography.h2, styles.errorText, isDark && styles.darkTitle]}>
            {error}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: tintColor },
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={loadListings}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!items || items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer, { justifyContent: 'center', alignItems: 'center' }]}> 
        <FontAwesome name="shopping-cart" size={64} color={isDark ? '#888' : '#bbb'} style={{ marginBottom: 24 }} />
        <Text style={[Typography.h2, styles.emptyText, isDark && styles.darkTitle]}>Your cart is empty</Text>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: tintColor },
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonText}>Browse Listings</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalPrice = items.reduce((sum, item) => {
    const listing = listings[item.listing_id];
    return sum + (listing?.price || 0);
  }, 0);

  const handleCheckout = async () => {
    try {
      // TODO: Implement checkout logic
      Alert.alert('Success', 'Checkout functionality coming soon!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to checkout');
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Shopping Cart',
          headerRight: () => (
            <Pressable
              style={({ pressed }) => [
                styles.clearButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
              onPress={clearCart}
            >
              <FontAwesome name="trash" size={20} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.itemsContainer}>
        {items.map((item) => {
          const listing = listings[item.listing_id];
          if (!listing) return null;

          const totalItemPrice = listing.price || 0;

          return (
            <Pressable
              key={`${item.user_id}-${item.listing_id}`}
              style={[styles.item, isDark && styles.darkItem]}
              onPress={() => router.push(`/listing/${listing.id}`)}
            >
              <Image
                source={{ uri: listing.image_urls?.[0] || '' }}
                style={styles.itemImage}
                defaultSource={require('@/assets/images/placeholder.png')}
              />
              <View style={styles.itemDetails}>
                <Text style={[Typography.h3, styles.itemTitle, isDark && styles.darkItemTitle]}>
                  {listing.title || 'Untitled Listing'}
                </Text>
                <Text style={[styles.itemPrice, { color: tintColor }]}>
                  ₹{listing.price || 0}/month
                </Text>
                <Text style={[styles.itemLocation, isDark && styles.darkItemLocation]}>
                  {listing.address || 'No address provided'}
                </Text>
                <Text style={[styles.dates, isDark && styles.darkDates]}>
                  {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                </Text>
                <Text style={[styles.totalItemPrice, { color: tintColor }]}>
                  Total: ₹{totalItemPrice}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.removeButton,
                  { opacity: pressed ? 0.7 : 1 }
                ]}
                onPress={() => removeFromCart(item.listing_id)}
              >
                <FontAwesome name="times" size={20} color="#FF3B30" />
              </Pressable>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.footer, isDark && styles.darkFooter]}>
        <View style={styles.totalContainer}>
          <Text style={[Typography.h3, styles.totalLabel, isDark && styles.darkTotalLabel]}>
            Total:
          </Text>
          <Text style={[Typography.h2, styles.totalPrice, { color: tintColor }]}>
            ₹{totalPrice}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.checkoutButton,
            { backgroundColor: tintColor },
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#FF3B30',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  clearButtonText: {
    marginLeft: 8,
    color: '#FF3B30',
    fontSize: 16,
  },
  itemsContainer: {
    flex: 1,
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkItem: {
    backgroundColor: '#2a2a2a',
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  itemTitle: {
    color: '#000',
    marginBottom: 4,
  },
  darkItemTitle: {
    color: '#fff',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  darkItemLocation: {
    color: '#999',
  },
  dates: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  darkDates: {
    color: '#999',
  },
  totalItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  darkFooter: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    color: '#000',
  },
  darkTotalLabel: {
    color: '#fff',
  },
  totalPrice: {
    color: '#000',
  },
  checkoutButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 20,
    color: '#666',
    marginBottom: 20,
    fontWeight: '600',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  darkTitle: {
    color: '#fff',
  },
});