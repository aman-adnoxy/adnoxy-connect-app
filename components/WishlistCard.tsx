import { StyleSheet, Image, Pressable, View as RNView, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useWishlist } from '@/hooks/useWishlist';
import { Listing } from '@/types/listing';
import { useState, useEffect } from 'react';
import { listingsService } from '@/services/listings';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = Math.floor((screenWidth - 48) / 2); // Half of screen width minus padding and gap
const IMAGE_HEIGHT = Math.floor(CARD_WIDTH * 0.75); // 4:3 aspect ratio

interface WishlistCardProps {
  item: Listing;
  tintColor: string;
  onWishlistToggle?: () => void;
}

function WishlistButton({ 
  listingId, 
  isDark, 
  onWishlistToggle 
}: { 
  listingId: string, 
  isDark: boolean,
  onWishlistToggle?: () => void 
}) {
  const { items, addToWishlist, removeFromWishlist } = useWishlist();
  const isWishlisted = items.some(item => item.id === listingId);

  const handlePress = (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    if (onWishlistToggle) {
      onWishlistToggle();
    } else {
      if (isWishlisted) {
        removeFromWishlist(listingId);
      } else {
        // We need to get the full listing to add it to wishlist
        listingsService.getListingById(listingId).then(listing => {
          addToWishlist(listing);
        });
      }
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.wishlistButton,
        { opacity: pressed ? 0.7 : 1 },
        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
      ]}
    >
      <FontAwesome
        name={isWishlisted ? "heart" : "heart-o"}
        size={20}
        color={isWishlisted ? "#ff3b30" : isDark ? "#000" : "#000"}
        style={styles.wishlistIcon}
      />
    </Pressable>
  );
}

export function WishlistCard({ item, tintColor, onWishlistToggle }: WishlistCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const imageUrl = item.image_urls[0];

  return (
    <Link href={{
      pathname: '/listing/[id]',
      params: { id: item.id }
    }} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.cardContainer,
          isDark && styles.darkCardContainer,
          { opacity: pressed ? 0.7 : 1 }
        ]}
      >
        <RNView style={styles.card}>
          <RNView style={styles.imageContainer}> 
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
              />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <FontAwesome name="image" size={32} color={isDark ? '#666' : '#999'} />
              </View>
            )}
            <WishlistButton 
              listingId={item.id} 
              isDark={isDark} 
              onWishlistToggle={onWishlistToggle}
            />
          </RNView>
          <View style={[styles.contentContainer, isDark && styles.darkContentContainer]}>
            <Text style={[Typography.body2, styles.location, isDark && styles.darkLocation]} numberOfLines={1}>
              {item.address}
            </Text>
            <Text style={[Typography.caption, styles.price, isDark && styles.darkPrice]} numberOfLines={1}>
              ₹{item.price}/month
            </Text>
            <View style={styles.footerRow}>
              <Text style={[Typography.category, styles.category, isDark && styles.darkCategory]} numberOfLines={1}>
                {item.category}
              </Text>
              <Text style={[Typography.caption, styles.availability, isDark && styles.darkAvailability]}>
                {item.availability_start}
              </Text>
            </View>
          </View>
        </RNView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: 'transparent',
  },
  darkCardContainer: {
    backgroundColor: 'transparent',
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  darkCard: {
    backgroundColor: '#1c1c1c',
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  wishlistIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  contentContainer: {
    padding: 8,
    backgroundColor: '#fff',
    width: CARD_WIDTH,
    overflow: 'hidden',
  },
  darkContentContainer: {
    backgroundColor: '#1c1c1c',
  },
  price: {
    color: '#000',
    marginBottom: 2,
  },
  darkPrice: {
    color: '#fff',
  },
  location: {
    color: '#666',
    marginBottom: 4,
  },
  darkLocation: {
    color: '#999',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    alignItems: 'center',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  category: {
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    flexShrink: 1,
    marginRight: 8,
    maxWidth: '70%',
    overflow: 'hidden',
  },
  darkCategory: {
    color: '#999',
    backgroundColor: '#2a2a2a',
  },
  availability: {
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 11,
    flexShrink: 0,
    maxWidth: '40%',
    overflow: 'hidden',
  },
  darkAvailability: {
    color: '#81C784',
    backgroundColor: 'rgba(129, 199, 132, 0.1)',
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});