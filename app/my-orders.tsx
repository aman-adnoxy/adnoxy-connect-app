import { StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { bookingsService } from '@/services/bookings';
import { BookingRequest } from '@/types/booking';
import { bookingItemsService } from '@/services/booking_items';
import { useAuth } from '@/contexts/AuthContext';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import Colors from '@/constants/Colors';

export default function MyOrdersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [listings, setListings] = useState<Record<string, Listing>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserBookings();
  }, []);

  const loadUserBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // First, get all user bookings
      const userBookings = await bookingsService.getUserBookings(user.id);
      setBookings(userBookings);
      
      // Create a map to store listing IDs for each booking
      const listingIdsMap: Record<string, string[]> = {};
      
      // Get booking items for each booking to get listing IDs
      for (const booking of userBookings) {
        const bookingItems = await bookingItemsService.getBookingItems(booking.id);
        listingIdsMap[booking.id] = bookingItems.map(item => item.listing_id);
      }
      
      // Collect all unique listing IDs
      const uniqueListingIds = [...new Set(
        Object.values(listingIdsMap).flat()
      )];
      
      // Load listing details for all unique listing IDs
      const listingDetails: Record<string, Listing> = {};
      for (const listingId of uniqueListingIds) {
        try {
          const listing = await listingsService.getListingById(listingId);
          if (listing) {
            listingDetails[listingId] = listing;
          }
        } catch (error) {
          console.error(`Error loading listing ${listingId}:`, error);
        }
      }
      
      setListings(listingDetails);
    } catch (error) {
      console.error('Error loading user bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: BookingRequest['status']) => {
    switch (status) {
      case 'completed':
        return styles.completedStatus;
      case 'confirmed':
        return styles.activeStatus;
      case 'pending':
        return styles.pendingStatus;
      case 'cancelled':
        return styles.canceledStatus;
      default:
        return {};
    }
  };
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={{ height: 24 }} />
      <View style={[styles.header, { marginTop: 10 }, isDark && styles.darkHeader]}>
        <FontAwesome 
          name="arrow-left" 
          size={24} 
          color={isDark ? '#fff' : '#000'} 
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={[styles.title, isDark && styles.darkText]}>My Orders</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && styles.darkText]}>
            You haven't made any bookings yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={({ item: booking }) => (
            <View style={[styles.orderCard, isDark && styles.darkOrderCard]}>
              <View style={styles.orderHeader}>
                <Text style={[styles.orderId, isDark && styles.darkText]}>
                  Order #{booking.id}
                </Text>
                <Text style={[
                  styles.orderStatus,
                  getStatusColor(booking.status)
                ]}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Text>
              </View>
              <Text style={[styles.price, isDark && styles.darkText]}>
                Total: ${booking.total_price}
              </Text>
              <Text style={[styles.dates, isDark && styles.darkText]}>
                Created: {new Date(booking.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkOrderCard: {
    backgroundColor: '#1a1a1a',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  orderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 14,
  },
  completedStatus: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    color: '#4CAF50',
  },
  activeStatus: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    color: '#2196F3',
  },
  pendingStatus: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    color: '#FF9800',
  },
  canceledStatus: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    color: '#F44336',
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  dates: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});
