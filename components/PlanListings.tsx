import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '@/types/listing';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PlanListingsProps {
  listings: Listing[];
  onRemoveListing: (listingId: string) => void;
  startDate: string;
  endDate: string;
}

const PlanListings: React.FC<PlanListingsProps> = ({
  listings,
  onRemoveListing,
  startDate,
  endDate,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isListingAvailable = (listing: Listing) => {
    // TODO: Implement availability check based on listing's calendar
    return true;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isDark && styles.darkText]}>Listings in Plan</Text>
      <ScrollView style={styles.scrollView}>
        {listings.map((listing) => {
          const isAvailable = isListingAvailable(listing);
          return (
            <View
              key={listing.id}
              style={[
                styles.listingCard,
                isDark && styles.darkListingCard,
                !isAvailable && styles.unavailableListing,
              ]}
            >
              <Image
                source={{ uri: listing.image_urls[0] }}
                style={styles.listingImage}
                resizeMode="cover"
              />
              <View style={styles.listingInfo}>
                <Text style={[styles.listingTitle, isDark && styles.darkText]}>
                  {listing.title}
                </Text>
                <Text style={[styles.listingLocation, isDark && styles.darkText]}>
                  {listing.city}{listing.area ? `, ${listing.area}` : ''}
                </Text>
                <Text style={[styles.listingPrice, isDark && styles.darkText]}>
                  ${listing.price} per night
                </Text>
                {!isAvailable && (
                  <Text style={styles.unavailableText}>
                    Not available for selected dates
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveListing(listing.id)}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={isDark ? '#fff' : '#000'}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  darkText: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  darkListingCard: {
    backgroundColor: '#2a2a2a',
    borderColor: '#404040',
  },
  unavailableListing: {
    opacity: 0.7,
  },
  listingImage: {
    width: 100,
    height: 100,
  },
  listingInfo: {
    flex: 1,
    padding: 12,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listingLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  unavailableText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  removeButton: {
    padding: 12,
  },
});

export default PlanListings; 