import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Pressable, Linking, Share as Sharing } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome'; // Keep this for other FontAwesome usage
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'; // New import
import { faCartPlus } from '@fortawesome/free-solid-svg-icons'; // New import
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons'; // New import
import { usersService } from '@/services/users';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCart } from '@/hooks/useCart';
import ListingMapModal from './ListingMapModal'; // Add this import
import AddToPlanModal from '@/components/AddToPlanModal';
import StaticMapView from '@/components/StaticMapView'; // Import StaticMapView

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },

  // Image Carousel
  imageCarousel: {
    height: 300,
    position: 'relative',
  },
  listingImage: {
    width: screenWidth,
    height: 300,
    resizeMode: 'cover',
  },
  carouselHeader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselFooter: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  darkPaginationDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  darkPaginationDotActive: {
    backgroundColor: '#fff',
  },
  imageCounter: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Content Sections
  content: {
    padding: 20, // Increased padding for more breathing room
    backgroundColor: '#fff',
  },
  darkContent: {
    backgroundColor: '#000',
  },
  header: {
    marginBottom: 24, // More space below header
  },
  title: {
    fontSize: 28, // Larger title
    fontWeight: '800', // Bolder title
    marginBottom: 8,
    color: '#000',
  },
  price: {
    fontSize: 24, // Larger price
    fontWeight: '700', // Bolder price
    color: '#000',
  },
  darkPrice: {
    color: '#fff',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: { // Unified style for text in info rows
    marginLeft: 12, // Increased margin for icon separation
    fontSize: 16,
    color: '#000',
  },
  darkInfoText: {
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0', // Lighter divider
    marginVertical: 24, // More vertical space
  },
  sectionTitle: {
    fontSize: 20, // Slightly larger section titles
    fontWeight: '700', // Bolder section titles
    marginBottom: 16, // More space below section title
    color: '#000',
  },
  description: {
    lineHeight: 24,
    fontSize: 16, // Consistent font size
    color: '#333', // Slightly darker text for readability
  },
  darkDescription: {
    color: '#ccc',
  },

  // Map Section
  mapSectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Reduced shadow opacity
    shadowRadius: 4,
    elevation: 3,
  },
  darkMapSectionContainer: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  mapSectionContent: {
    padding: 16,
  },
  mapImageContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 8,
    marginTop: 12,
    overflow: 'hidden',
  },
  expandIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  showMapButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  darkShowMapButton: {
    backgroundColor: '#fff',
  },
  showMapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  darkShowMapButtonText: {
    color: '#000',
  },
  mapActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute space evenly
    marginTop: 12,
    marginBottom: 12,
  },
  mapActionButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Take equal space
    marginHorizontal: 5, // Add some margin between buttons
  },
  darkMapActionButton: {
    backgroundColor: '#fff',
  },
  mapActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  darkMapActionButtonText: {
    color: '#000',
  },

  // Availability
  availabilityContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
  },
  darkAvailabilityContainer: {
    backgroundColor: '#2a2a2a',
  },
  availabilityText: { // Unified style for availability text
    color: '#000',
    fontSize: 16,
  },
  darkAvailabilityText: {
    color: '#fff',
  },

  // Sticky Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingHorizontal: 20, // Increased padding
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  darkFooter: {
    backgroundColor: '#1a1a1a',
    borderTopColor: '#333',
  },
  footerLeft: {
    flex: 1,
    marginRight: 12,
  },
  pricePerDay: {
    fontSize: 22, // Larger price in footer
    fontWeight: '700',
    color: '#000',
  },
  darkPricePerDay: {
    color: '#fff',
  },
  priceUnit: {
    fontSize: 16,
    fontWeight: '400',
  },
  dates: {
    fontSize: 14, // Slightly larger dates
    color: '#666',
    marginTop: 4,
  },
  darkDates: {
    color: '#ccc',
  },
  headerDates: {
    marginTop: 8, // Add some margin from the price
    fontSize: 16, // Slightly larger font size for prominence
    fontWeight: '600', // Make it a bit bolder
    color: '#333', // A slightly darker color for better contrast
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10, // Increased gap between buttons
  },
  bookButton: {
    backgroundColor: '#FF385C', // Airbnb red
    borderRadius: 8,
    paddingVertical: 14, // Increased padding
    paddingHorizontal: 20, // Added horizontal padding
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150, // Ensure button has a minimum width
  },
  cartButton: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 14, // Adjusted padding
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCartButton: {
    backgroundColor: '#fff',
  },
  disabledCartButton: {
    backgroundColor: '#ccc', // Lighter background for disabled
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
});

export default function ListingDetailsScreen({ id: propId }: { id?: string }) {
  const { id } = useLocalSearchParams();
  const listingId = propId || (typeof id === 'string' ? id : '');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { plans, addToPlan, removeFromPlan } = usePlan();
  const { user } = useAuth();
  const { items: cartItems, addToCart } = useCart();
  
  // Check if the current listing is in cart
  const isInCart = cartItems.some(item => item.listing_id === id);

  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [ownerInfo, setOwnerInfo] = useState<{ username: string; email: string } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCartDatePicker, setShowCartDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showMapModal, setShowMapModal] = useState(false); // New state
  const [showAddToPlan, setShowAddToPlan] = useState(false);

  useEffect(() => {
    if (listingId) {
      loadListingAndImages();
    }
  }, [listingId]);

  const loadListingAndImages = async () => {
    try {
      setLoading(true);
      const data = await listingsService.getListingById(listingId as string);
      setListing(data);
      
      // Get owner information
      if (data.user_id) {
        const userData = await usersService.getUserById(data.user_id);
        if (userData) {
          setOwnerInfo({
            username: userData.name || userData.email.split('@')[0],
            email: userData.email
          });
        }
      }

      // Set the listing images from the data
      setImages(data.image_urls && data.image_urls.length > 0 
        ? data.image_urls 
        : [require('@/assets/images/listing-images/downtown-digital.jpg')]
      );
    } catch (error) {
      console.error('Error loading listing:', error);
      Alert.alert('Error', 'Failed to load listing details');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToBook = () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (!startDate || (startDate && endDate)) {
        setStartDate(selectedDate);
        setEndDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };
  const handleAddToCart = () => {
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (cartItems.some(item => item.listing_id === id)) {
      Alert.alert('Already in Cart', 'This listing is already in your cart');
      return;
    }
    setShowCartDatePicker(true);
  };

  const handleCartDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowCartDatePicker(false);
      return;
    }
    if (selectedDate && user && listing) {
      setShowCartDatePicker(false);
      // Set end date to start date + 1 month
      const endDate = new Date(selectedDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      addToCart({
        user_id: user.id,
        listing_id: listing.id,
        start_date: selectedDate,
        end_date: endDate,
        added_at: new Date().toISOString(),
        notes: ''
      });
      Alert.alert('Success', 'Added to cart!');
    }
  };

  const handleLocationPress = () => {
    if (listing?.latitude && listing?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`;
      Linking.openURL(url).catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps');
      });
    }
  };

  const handleStreetViewPress = () => {
    if (listing?.latitude && listing?.longitude) {
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${listing.latitude},${listing.longitude}`;
      Linking.openURL(url).catch((err) => {
        console.error('Error opening street view:', err);
        Alert.alert('Error', 'Could not open Street View');
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.container]}>
        <Text style={[Typography.h2, isDark && styles.darkText]}>Listing not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <Stack.Screen
        options={{
          headerShown: false,
          headerBackVisible: true,
        }}
      />
      <ScrollView style={[styles.scrollView, { marginBottom: 80 }]}>
        {/* Image Carousel */}        
        <View style={styles.imageCarousel}>
          <View style={styles.carouselHeader}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.rightButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  if (listing) {
                    Sharing.share({
                      title: listing.title,
                      message: `Check out this listing: ${listing.title}\nPrice: ₹${listing.price}/month\nLocation: ${listing.address}`
                    });
                  }
                }}
              >
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowAddToPlan(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const contentOffset = event.nativeEvent.contentOffset.x;
              const index = Math.round(contentOffset / screenWidth);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {images.map((url, index) => (
              <Image
                key={index}
                source={typeof url === 'string' ? { uri: url } : url}
                style={styles.listingImage}
              />
            ))}
          </ScrollView>          
            <View style={styles.carouselFooter}>
            {images.length > 1 && (
              <View style={styles.paginationContainer}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentImageIndex && styles.paginationDotActive,
                      isDark && styles.darkPaginationDot,
                      index === currentImageIndex && isDark && styles.darkPaginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1}/{images.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, isDark && styles.darkContent]}>
          <View style={styles.header}>
            <Text style={[Typography.h1, styles.title, isDark && styles.darkText]}>
              {listing.title}
            </Text>
            <Text style={[Typography.price, styles.price, isDark && styles.darkPrice]}>
              ₹{listing.price} / month
            </Text>
            {listing.availability_start && listing.availability_end && (
              <Text style={[Typography.caption, styles.dates, styles.headerDates, isDark && styles.darkDates]}>
                {new Date(listing.availability_start).toLocaleDateString()} - {new Date(listing.availability_end).toLocaleDateString()}
              </Text>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <FontAwesome name="map-marker" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[Typography.body1, styles.infoText, isDark && styles.darkInfoText]}>
                {listing.address || listing.google_location}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome name="tag" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[Typography.body1, styles.infoText, isDark && styles.darkInfoText]}>
                {listing.category}
              </Text>
            </View>
            {listing.height && listing.width && (
              <View style={styles.infoRow}>
                <Ionicons name="cube-outline" size={20} color={isDark ? '#fff' : '#000'} />
                <Text style={[Typography.body1, styles.infoText, isDark && styles.darkInfoText]}>
                  Dimensions: {listing.height} x {listing.width} {listing.unit}
                </Text>
              </View>
            )}
            {ownerInfo && (
              <View style={styles.infoRow}>
                <FontAwesome name="user" size={20} color={isDark ? '#fff' : '#000'} />
                <Text style={[Typography.body1, styles.infoText, isDark && styles.darkInfoText]}>
                  Listed by {ownerInfo.username}
                </Text>
              </View>
            )}
            {listing.listing_source_id && (
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color={isDark ? '#fff' : '#000'} />
                <Text style={[Typography.body1, styles.infoText, isDark && styles.darkInfoText]}>
                  Source ID: {listing.listing_source_id}
                </Text>
              </View>
            )}
            {listing.lighting_type && (
              <View style={styles.infoRow}>
                <Ionicons name="bulb-outline" size={20} color={isDark ? '#fff' : '#000'} />
                <Text style={[Typography.body1, styles.infoText, isDark && styles.darkInfoText]}>
                  Lighting Type: {listing.lighting_type}
                </Text>
              </View>
            )}
            {listing.quantity != null && (
              <View style={styles.infoRow}>
                <Ionicons name="layers-outline" size={20} color={isDark ? '#fff' : '#000'} />
                <Text style={[Typography.body1, styles.infoText, isDark && styles.darkInfoText]}>
                  Quantity: {listing.quantity}
                </Text>
              </View>
            )}
            <View style={[styles.infoRow, styles.mapActionsContainer]}>
              <TouchableOpacity 
                style={[styles.mapActionButton, isDark && styles.darkMapActionButton]} 
                onPress={handleLocationPress}
              >
                <Ionicons name="map-outline" size={16} color={isDark ? '#000' : '#fff'} />
                <Text style={[styles.mapActionButtonText, isDark && styles.darkMapActionButtonText]}>
                  Open in Maps
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mapActionButton, isDark && styles.darkMapActionButton]}
                onPress={handleStreetViewPress}
              >
                <FontAwesome name="street-view" size={16} color={isDark ? '#000' : '#fff'} />
                <Text style={[styles.mapActionButtonText, isDark && styles.darkMapActionButtonText]}>
                  View in Street View
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoSection}>
            <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkText]}>
              About this space
            </Text>
            <Text style={[Typography.body1, styles.description, isDark && styles.darkText]}>
              {listing.description}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Where's the listing section */}
          <View style={[styles.mapSectionContainer, isDark && styles.darkMapSectionContainer]}>
            <View style={styles.mapSectionContent}>
              <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkText]}>
                Where's the listing
              </Text>
              {listing.latitude != null && listing.longitude != null && typeof listing.latitude === 'number' && typeof listing.longitude === 'number' && (
                <TouchableOpacity
                  onPress={() => setShowMapModal(true)} // Open modal
                  activeOpacity={0.8}
                  style={styles.mapImageContainer}
                >
                  <StaticMapView
                    latitude={listing.latitude}
                    longitude={listing.longitude}
                    height={screenWidth * 0.75} // Calculate height based on aspect ratio
                    width={'100%'}
                  />
                  {/* Add expand icon here */}
                  <View style={styles.expandIconContainer}>
                    <Ionicons name="expand-outline" size={24} color="#000" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>


          {listing.supporting_documents && listing.supporting_documents.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoSection}>
                <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkText]}>
                  Supporting Documents
                </Text>
                {listing.supporting_documents.map((docUrl, index) => (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => Linking.openURL(docUrl)}
                    style={styles.infoRow}
                  >
                    <Ionicons name="document-text-outline" size={20} color={isDark ? '#fff' : '#000'} />
                    <Text style={[Typography.body1, styles.infoText, isDark && styles.darkInfoText, { textDecorationLine: 'underline' }]}>
                      Document {index + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Sticky Footer */}
      <View style={[styles.footer, isDark && styles.darkFooter]}>
        <View style={styles.footerLeft}>
          <Text style={[styles.pricePerDay, isDark && styles.darkPricePerDay]}>
            ₹{listing.price}
            <Text style={styles.priceUnit}> / month</Text>
          </Text>
            <Text style={[styles.dates, isDark && styles.darkDates]}>
              {listing.availability_start ? new Date(listing.availability_start).toLocaleDateString() : ''}
            </Text>
      
        </View>
        <View style={styles.footerButtons}>          
          <TouchableOpacity
            style={[
              styles.cartButton, 
              isDark && styles.darkCartButton,
              isInCart && styles.disabledCartButton
            ]}
            onPress={handleAddToCart}
            disabled={isInCart}
          >
            <FontAwesomeIcon 
              icon={isInCart ? faCircleCheck : faCartPlus} 
              size={20} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleRequestToBook}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Request to Book</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={startDate && !endDate ? startDate : endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={listing.availability_start ? new Date(listing.availability_start) : new Date()}
        />
      )}
      {showCartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={handleCartDateChange}
          minimumDate={listing.availability_start ? new Date(listing.availability_start) : new Date()}
        />
      )}

      {listing.latitude && listing.longitude && (
        <ListingMapModal
          visible={showMapModal}
          onClose={() => setShowMapModal(false)}
          latitude={listing.latitude}
          longitude={listing.longitude}
          title={listing.title ?? ''}
          address={listing.address ?? ''}
        />
      )}

      <AddToPlanModal
        visible={showAddToPlan}
        onClose={() => setShowAddToPlan(false)}
        listing={listing}
      />
    </SafeAreaView>
  );
}
