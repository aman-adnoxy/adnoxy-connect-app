import { StyleSheet, View, SafeAreaView, Alert, Image, Animated, Easing } from 'react-native';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { MapView, Marker, PROVIDER_GOOGLE } from '../components/MapView';
import PriceMarker from '@/components/PriceMarker';
import { Callout } from 'react-native-maps';
import { useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';
import { TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router'; // Import useLocalSearchParams
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface PlacePrediction {
  place_id: string;
  description: string;
}

interface GooglePlaceData {
  description: string;
}

interface GooglePlaceDetail {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function MapScreen() {
  const { latitude, longitude, title } = useLocalSearchParams(); // Get parameters
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapListings, setMapListings] = useState<Array<Listing>>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const animation = useRef(new Animated.Value(0)).current;

  const [region, setRegion] = useState<Region>({
    latitude: 23.0225,
    longitude: 72.5714,
    latitudeDelta: 0.024, // 20% increased zoom
    longitudeDelta: 0.024, // 20% increased zoom
  });

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      setRegion(newRegion);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  useEffect(() => {
    const fetchMapListings = async () => {
      try {
        const listings = await listingsService.getListingsLocationsAndPrices('Ahmedabad');
        setMapListings(listings);
      } catch (error) {
        console.error('Failed to fetch map listings:', error);
      }
    };

    fetchMapListings();
  }, []);

  const handlePlaceSelect = (data: GooglePlaceData, details: GooglePlaceDetail | null) => {
    try {
      if (!details?.geometry?.location) {
        console.log('No location details available');
        return;
      }
      
      const { lat, lng } = details.geometry.location;
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

      setRegion(newRegion);
    } catch (error) {
      console.error('Error handling place selection:', error);
    }
  };

  useEffect(() => {
    if (selectedListing) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedListing]);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerText, isDark && styles.darkHeaderText]}>
          {title || 'Map View'}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, isDark && styles.darkSearchInputWrapper]}>
            <Text style={[styles.searchInput, isDark && styles.darkSearchInput]}>
              Ahmedabad
            </Text>
          </View>
        </View>
        
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={setRegion}
          onMapReady={() => setIsMapReady(true)}
        >
          {isMapReady && mapListings.length > 0 && mapListings.map((listing) => (
            <Marker
              key={listing.id}
              coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
              onPress={() => setSelectedListing(listing)} // Set selected listing on marker press
              zIndex={selectedListing?.id === listing.id ? 2 : 1} // Bring selected marker to front
            >
              <Ionicons name="location" size={40} color="#000000" />
            </Marker>
          ))}
        </MapView>

        <TouchableOpacity
          style={[styles.currentLocationButton, { backgroundColor: tintColor }]}
          onPress={getCurrentLocation}
        >
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>

        {selectedListing && (
          <Animated.View
            style={[
              styles.listingDetailCard,
              isDark && styles.darkListingDetailCard,
              {
                transform: [{
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [200, 0], // Slide up from 200px below
                  }),
                }],
                opacity: animation,
              },
            ]}
          >
            <TouchableOpacity 
              onPress={() => router.push(`/listing/${selectedListing.id}`)} 
              style={styles.listingCardContent} // Apply flex to this TouchableOpacity
            >
              <Image source={{ uri: selectedListing.image_urls[0] }} style={styles.listingImage} />
              <View style={styles.listingInfo}>
                <Text style={[styles.listingTitle, isDark && styles.darkListingTitle]}>{selectedListing.title} ({selectedListing.quantity})</Text>
                <Text style={[styles.listingPrice, isDark && styles.darkListingPrice]}>₹{selectedListing.price}/month</Text>
                {selectedListing.address && (
                  <Text style={[styles.listingAddress, isDark && styles.darkListingAddress]}>
                    {selectedListing.address}
                  </Text>
                )}
                {selectedListing.landmark && (
                  <Text style={[styles.listingLandmark, isDark && styles.darkListingLandmark]}>
                    Landmark: {selectedListing.landmark}
                  </Text>
                )}
                {selectedListing.height && selectedListing.width && selectedListing.unit && (
                  <Text style={[styles.listingSize, isDark && styles.darkListingSize]}>
                    Size: {selectedListing.height}x{selectedListing.width} {selectedListing.unit}
                  </Text>
                )}
                {/* <Text style={[styles.listingCity, isDark && styles.darkListingCity]}>{selectedListing.city}</Text> */}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedListing(null)} style={styles.closeButton}>
              <Ionicons name="close-circle" size={24} color={isDark ? '#999' : '#666'} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
    padding: 8,
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row', // Enable flexbox
    alignItems: 'center', // Center items vertically
    justifyContent: 'center', // Center items horizontally
    padding: 16,
    backgroundColor: 'transparent',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    // textAlign: 'center', // Remove this as flexbox will handle centering
    flex: 1, // Allow text to take available space and push back button
  },
  darkHeaderText: {
    color: '#fff',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center', // Center content horizontally
    paddingHorizontal: 20, // Keep padding for spacing
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkSearchInputWrapper: {
    backgroundColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000', // Default text color
    textAlign: 'center', // Center the text
  },
  darkSearchInput: {
    color: '#fff',
  },
  currentLocationButton: {
    position: 'absolute',
    color: '#fff',
    bottom: 80,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  listingDetailCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  darkListingDetailCard: {
    backgroundColor: '#2a2a2a',
  },
  listingImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 15,
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  darkListingTitle: {
    color: '#fff',
  },
  listingPrice: {
    fontSize: 16,
    color: '#000',
    marginTop: 5,
  },
  darkListingPrice: {
    color: '#fff',
  },
  listingAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  darkListingAddress: {
    color: '#ccc',
  },
  listingLandmark: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  darkListingLandmark: {
    color: '#ccc',
  },
  listingSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  darkListingSize: {
    color: '#ccc',
  },
  listingCity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  darkListingCity: {
    color: '#ccc',
  },
  closeButton: {
    padding: 5,
  },
  listingCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
