import { StyleSheet, Image, Pressable, ActivityIndicator, View as RNView, ScrollView, Dimensions } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { usePlan } from '@/hooks/usePlan';
import type { Listing } from '@/types/listing';
import { listingsService } from '@/services/listings';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import AddToPlanModal from '@/components/AddToPlanModal';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 32; // Full width minus padding
const IMAGE_HEIGHT = CARD_WIDTH * 0.75; // 4:3 aspect ratio

interface ListingCardProps {
  item: Listing;
  tintColor: string;
  onWishlistToggle?: () => void;
  onPress?: (listingId: string) => void;
  showVerificationStatus?: boolean; // New prop to conditionally show verification status
}

function ImageCarousel({ images, isDark }: { images: string[], isDark: boolean }) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / CARD_WIDTH);
    setActiveIndex(index);
  };

  if (images.length === 0) {
    return (
      <RNView style={[styles.imageContainer, styles.imageErrorContainer, isDark && styles.darkImageErrorContainer]}>
        <Text style={[styles.imageErrorText, isDark && styles.darkImageErrorText]}>
          No images available
        </Text>
      </RNView>
    );
  }

  return (
    <RNView style={styles.imageContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carouselScrollView}
      >
        {images.map((image, index) => (
          <RNView key={index} style={styles.carouselItem}>
            <Image
              source={{ uri: image }}
              style={styles.image}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
            {imageLoading && (
              <RNView style={[styles.imageLoadingContainer, isDark && styles.darkImageLoadingContainer]}>
                <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
              </RNView>
            )}
            {imageError && (
              <RNView style={[styles.imageErrorContainer, isDark && styles.darkImageErrorContainer]}>
                <Text style={[styles.imageErrorText, isDark && styles.darkImageErrorText]}>
                  Failed to load image
                </Text>
              </RNView>
            )}
          </RNView>
        ))}
      </ScrollView>
      {images.length > 1 && (
        <RNView style={styles.paginationContainer}>
          {images.map((_, index) => (
            <RNView
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive,
                isDark && styles.darkPaginationDot,
                index === activeIndex && isDark && styles.darkPaginationDotActive,
              ]}
            />
          ))}
        </RNView>
      )}
    </RNView>
  );
}

export function ListingCard({ item, tintColor, onWishlistToggle, onPress, showVerificationStatus }: ListingCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAddToPlan, setShowAddToPlan] = useState(false);
  const router = useRouter();
   
  // Determine the actual press handler based on whether an onPress prop is provided
  const handleCardPress = () => {
    if (onPress) {
      onPress(item.id);
    } else {
      router.push(`/listing/${item.id}?imageIndex=${currentImageIndex}`);
    }
  };

  const handleScroll = (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / CARD_WIDTH);
    setCurrentImageIndex(index);
  };

  return (
    <Pressable
      style={() => [
        styles.listingItem,
        isDark && styles.darkListingItem,
      ]}
      onPress={handleCardPress} // Use the determined handler for the whole card
    >
      <View style={[styles.imageContainer, isDark && styles.darkImageContainer]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
        >
          {item.image_urls.map((url, index) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={styles.image}
            />
          ))}
        </ScrollView>
        {item.image_urls.length > 1 && (
          <View style={styles.paginationContainer}>
            {item.image_urls.map((_, index) => (
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
      </View>
      <View
        style={[
          styles.textContainer,
          isDark && styles.darkTextContainer,
        ]}
      >
        <View style={styles.titleRow}>
          <Text style={[Typography.h3, styles.listingTitle, isDark && styles.darkListingTitle]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[Typography.price, styles.priceText, isDark && styles.darkPriceText]}>
            ₹{item.price}/month
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <Text style={[Typography.body2, styles.listingLocation, isDark && styles.darkListingLocation]} numberOfLines={1}>
            {item.google_location || item.address}
          </Text>
          <Text style={[Typography.caption, styles.availabilityText, isDark && styles.darkAvailabilityText]}>
            {item.availability_start ? `Available from ${new Date(item.availability_start).toLocaleDateString()}` : 'Not Available'}
          </Text>
        </View>
        <Text style={[Typography.category, styles.listingCategory, isDark && styles.darkListingCategory]}>
          {item.category}
        </Text>
      </View>
      {showVerificationStatus && (
        <View style={[
          styles.verificationBadge,
          item.verification_status === 'pending' && styles.badgePending,
          item.verification_status === 'approved' && styles.badgeApproved,
          item.verification_status === 'rejected' && styles.badgeRejected,
        ]}>
          <Ionicons 
            name={
              item.verification_status === 'approved' ? 'checkmark-circle' :
              item.verification_status === 'pending' ? 'time' :
              'close-circle'
            } 
            size={16} 
            color="#fff" 
            style={styles.badgeIcon} 
          />
          <Text style={styles.badgeText}>
            {item.verification_status.charAt(0).toUpperCase() + item.verification_status.slice(1)}
          </Text>
        </View>
      )}
      <Pressable
        onPress={() => setShowAddToPlan(true)}
        style={({ pressed }) => [
          styles.wishlistButton,
          { opacity: pressed ? 0.7 : 1 },
          { backgroundColor: tintColor }
        ]}
      >
        <Ionicons name="add-circle-outline" size={24} color="#fff" style={styles.wishlistIcon} />
      </Pressable>
      <AddToPlanModal
        visible={showAddToPlan}
        onClose={() => setShowAddToPlan(false)}
        listing={item}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listingItem: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkListingItem: {
    backgroundColor: '#1a1a1a',
    shadowColor: '#fff',
    shadowOpacity: 0.05,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  darkImageContainer: {
    backgroundColor: '#2a2a2a',
  },
  image: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    resizeMode: 'cover',
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  darkImageLoadingContainer: {
    backgroundColor: '#1a1a1a',
  },
  imageErrorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  darkImageErrorContainer: {
    backgroundColor: '#1a1a1a',
  },
  imageErrorText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    padding: 8,
  },
  darkImageErrorText: {
    color: '#999',
  },
  textContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  darkTextContainer: {
    backgroundColor: '#1a1a1a',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  listingTitle: {
    flex: 1,
    marginRight: 8,
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  darkListingTitle: {
    color: '#fff',
  },
  priceText: {
    color: '#000',
  },
  darkPriceText: {
    color: '#fff',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  listingLocation: {
    flex: 1,
    marginRight: 8,
    color: '#666',
    fontSize: 12,
  },
  darkListingLocation: {
    color: '#999',
  },
  availabilityText: {
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  darkAvailabilityText: {
    color: '#81C784',
    backgroundColor: 'rgba(129, 199, 132, 0.1)',
  },
  listingCategory: {
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8, // Added margin bottom for spacing
  },
  darkListingCategory: {
    color: '#999',
    backgroundColor: '#2a2a2a',
  },
  carouselScrollView: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  carouselItem: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 2,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  darkPaginationDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  darkPaginationDotActive: {
    backgroundColor: '#fff',
  },
  wishlistButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wishlistIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  // New styles for verification badge
  verificationBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)', // Default dark background
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgePending: {
    backgroundColor: Colors.light.warning,
  },
  badgeApproved: {
    backgroundColor: Colors.light.success,
  },
  badgeRejected: {
    backgroundColor: Colors.light.error,
  },
});
