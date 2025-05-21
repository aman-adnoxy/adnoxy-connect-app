import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Pressable, Linking, Share as Sharing } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { usersService } from '@/services/users';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCart } from '@/hooks/useCart';

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  darkContainer: {
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingHorizontal: 16,
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
    fontSize: 20,
    fontWeight: '600',
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
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  darkDates: {
    color: '#000',
  },
  footerButtons: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
  },
  bookButton: {
    flex: 3,
    backgroundColor: '#FF385C',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButton: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkCartButton: {
    backgroundColor: '#333',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCarousel: {
    height: 300,
    position: 'relative',
  },
  listingImage: {
    width: screenWidth,
    height: 300,
    resizeMode: 'cover',
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
  content: {
    padding: 16,
    backgroundColor: '#fff',
  },
  darkContent: {
    backgroundColor: '#000',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  price: {
    fontSize: 22,
    fontWeight: '600',
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
  location: {
    marginLeft: 8,
    color: '#000',
  },
  category: {
    marginLeft: 8,
    color: '#000',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000',
  },
  description: {
    lineHeight: 24,
    color: '#000',
  },
  availabilityContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
  },
  availability: {
    color: '#000',
    marginBottom: 4,
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
  },  // Removed backButton style as it's replaced by iconButton
  owner: {
    marginLeft: 8,
    color: '#000',
  },
  coordinates: {
    marginLeft: 8,
    color: '#000',
  },
  locationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginLeft: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  darkMapButton: {
    backgroundColor: '#fff',
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  darkMapButtonText: {
    color: '#000',
  },
  disabledCartButton: {
    backgroundColor: '#fff',
  },
});

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { items, addToWishlist, removeFromWishlist } = useWishlist();
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

  useEffect(() => {
    loadListingAndImages();
  }, [id]);

  const loadListingAndImages = async () => {
    try {
      setLoading(true);
      const data = await listingsService.getListingById(id as string);
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
        added_at: new Date().toISOString()
      });
      Alert.alert('Success', 'Added to cart!');
    }
  };

  const handleLocationPress = () => {
    if (listing?.location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${listing.location}`;
      Linking.openURL(url).catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Could not open maps');
      });
    }
  };

  const handleStreetViewPress = () => {
    if (listing?.location) {
      const url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${listing.location}`;
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

  const isWishlisted = items.some(item => item.id === listing.id);

  const handleWishlistToggle = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (isWishlisted) {
      removeFromWishlist(listing.id);
    } else {
      addToWishlist(listing);
    }
  };

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
                onPress={handleWishlistToggle}
              >
                <Ionicons 
                  name={isWishlisted ? "heart" : "heart-outline"} 
                  size={24} 
                  color={isWishlisted ? "#FF385C" : "#fff"} 
                />
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
            {/* <Text style={[Typography.price, styles.price, isDark && styles.darkPrice]}>
              ₹{listing.price}/month
            </Text> */}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <FontAwesome name="map-marker" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[Typography.body1, styles.location, isDark && styles.darkText]}>
                {listing.address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <FontAwesome name="tag" size={20} color={isDark ? '#fff' : '#000'} />
              <Text style={[Typography.body1, styles.category, isDark && styles.darkText]}>
                {listing.category}
              </Text>
            </View>
            {ownerInfo && (
              <View style={styles.infoRow}>
                <FontAwesome name="user" size={20} color={isDark ? '#fff' : '#000'} />
                <Text style={[Typography.body1, styles.owner, isDark && styles.darkText]}>
                  Listed by {ownerInfo.username}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <FontAwesome name="location-arrow" size={20} color={isDark ? '#fff' : '#000'} />
              <View style={{ flex: 1 }}>                
                {/* <Text style={[Typography.body1, styles.coordinates, isDark && styles.darkText]}>
                  {listing.location}
                </Text> */}
                <View style={styles.locationButtons}>
                  <TouchableOpacity 
                    style={[styles.mapButton, isDark && styles.darkMapButton]} 
                    onPress={handleLocationPress}
                  >
                    <Ionicons name="map-outline" size={16} color={isDark ? '#000' : '#fff'} />
                    <Text style={[styles.mapButtonText, isDark && styles.darkMapButtonText]}>
                      Open in Maps
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.mapButton, isDark && styles.darkMapButton]} 
                    onPress={handleStreetViewPress}
                  >
                    <Ionicons name="eye-outline" size={16} color={isDark ? '#000' : '#fff'} />
                    <Text style={[styles.mapButtonText, isDark && styles.darkMapButtonText]}>
                      See on Street View
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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

          <View style={styles.infoSection}>
            <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkText]}>
              Availability
            </Text>
            <View style={styles.availabilityContainer}>
              {listing.availability_start && listing.availability_end && (
                <Text style={[Typography.caption, styles.dates, isDark && styles.darkDates]}>
                  {new Date(listing.availability_start).toLocaleDateString()} - {new Date(listing.availability_end).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
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
            <Ionicons 
              name={isInCart ? "checkmark-circle-outline" : "cart-outline"} 
              size={20} 
              color={isInCart ? "#666" : "#fff"} 
              style={styles.buttonIcon} 
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
    </SafeAreaView>
  );
}