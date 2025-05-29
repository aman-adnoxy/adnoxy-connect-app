import { StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useCart } from '@/hooks/useCart';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import listingImages from '@/assets/images/listing-images';
import { useState, useEffect } from 'react';
import { Listing } from '@/types/listing';
import { listingsService } from '@/services/listings';

export function Cart() {
  const { items, removeFromCart, loading } = useCart();
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [totalPrice, setTotalPrice] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  useEffect(() => {
    const loadListings = async () => {
      const listingsMap: Record<string, Listing> = {};
      let total = 0;
      
      for (const item of items) {
        try {
          const listing = await listingsService.getListingById(item.listing_id);
          if (listing) {
            listingsMap[item.listing_id] = listing;
            total += listing.price;
          }
        } catch (error) {
          console.error('Error loading listing:', error);
        }
      }
      
      setListings(listingsMap);
      setTotalPrice(total);
    };

    loadListings();
  }, [items]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, isDark && styles.darkContainer]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, isDark && styles.darkContainer]}>
        <Text style={[styles.emptyText, isDark && styles.darkEmptyText]}>
          Your cart is empty
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <ScrollView style={styles.scrollView}>
        {items.map((item) => {
          const listing = listings[item.listing_id];
          if (!listing) return null;

          return (
            <View key={item.listing_id} style={[styles.cartItem, isDark && styles.darkCartItem]}>
              <Image
                source={listingImages[listing.image_urls[0] as keyof typeof listingImages]}
                style={styles.itemImage}
              />
              <View style={[styles.itemDetails, isDark && { backgroundColor: Colors.dark.cardBackground }]}>
                <Text style={[styles.itemTitle, isDark && styles.darkItemTitle]}>
                  {listing.title}
                </Text>
                <Text style={[styles.itemPrice, { color: tintColor }]}>
                  ${listing.price}/day
                </Text>
                <Text style={[styles.itemLocation, isDark && styles.darkItemLocation]}>
                  {listing.address || listing.city}
                </Text>
              </View>
              <Pressable
                style={[styles.removeButton, { backgroundColor: tintColor }]}
                onPress={() => removeFromCart(item.listing_id)}
              >
                <FontAwesome name="trash" size={20} color="#fff" />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.footer, isDark && styles.darkFooter]}>
        <Text style={[styles.totalText, isDark && styles.darkTotalText]}>
          Total: ${totalPrice}/day
        </Text>
        <Pressable
          style={[styles.checkoutButton, { backgroundColor: tintColor }]}
          onPress={() => {
            // TODO: Implement checkout functionality
            console.log('Checkout pressed');
          }}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  darkContainer: {
    backgroundColor: Colors.dark.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.cardBackground,
  },
  darkCartItem: {
    backgroundColor: Colors.dark.cardBackground,
    borderBottomColor: Colors.dark.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
    // Removed backgroundColor: 'transparent'
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  darkItemTitle: {
    color: Colors.dark.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemLocation: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  darkItemLocation: {
    color: Colors.dark.textSecondary,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  darkFooter: {
    backgroundColor: Colors.dark.background,
    borderTopColor: Colors.dark.border,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    // Removed backgroundColor: 'transparent'
    color: Colors.light.text,
    marginBottom: 16,
  },
  darkTotalText: {
    color: Colors.dark.text,
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
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 32,
  },
  darkEmptyText: {
    color: Colors.dark.textSecondary,
  },
});
