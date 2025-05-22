import { StyleSheet, View, SafeAreaView, Alert, Image, Animated, Easing } from 'react-native'; // Import Image, Animated, Easing
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { MapView, Marker, PROVIDER_GOOGLE } from '../components/MapView'; // Import MapView and Marker
import PriceMarker from '@/components/PriceMarker'; // Import PriceMarker
import { Callout } from 'react-native-maps'; // Import Callout directly from react-native-maps
import { useState, useRef, useEffect } from 'react';
import * as Location from 'expo-location';
import { TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { listingsService } from '@/services/listings'; // Import listingsService
import { Listing } from '@/types/listing'; // Import Listing type

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const mapRef = useRef<any>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [mapListings, setMapListings] = useState<Array<Listing>>([]); // State for listings on map
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null); // State for selected listing
  const animation = useRef(new Animated.Value(0)).current; // For floating window animation

  const [region, setRegion] = useState<Region>({
    latitude: 23.0225, // Ahmedabad latitude
    longitude: 72.5714, // Ahmedabad longitude
    latitudeDelta: 0.03, // Increased zoom (slightly less zoom than 0.02, but might be perceived as better initial view)
    longitudeDelta: 0.03, // Increased zoom
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
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setSelectedLocation({ latitude, longitude });

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  useEffect(() => {
    // Animate to Ahmedabad initially
    const initialRegion = {
      latitude: 23.0225,
      longitude: 72.5714,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };

    if (mapRef.current) {
      mapRef.current.animateToRegion(initialRegion, 1000);
    }
    // Removed getCurrentLocation() call from here as per user feedback.
  }, []);

  useEffect(() => {
    const fetchMapListings = async () => {
      try {
        // For now, fetch all listings. If we want to filter by visible map region,
        // we'd need to pass current map bounds to the service function.
        // For "Ahmedabad, Gujarat only", we can pass 'Ahmedabad' as city.
        const listings = await listingsService.getListingsLocationsAndPrices('Ahmedabad'); // Fetch listings for Ahmedabad
        setMapListings(listings);
      } catch (error) {
        console.error('Failed to fetch map listings:', error);
      }
    };

    fetchMapListings();
  }, []); // Empty dependency array to fetch once on mount, or add region to refetch on map move

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

      // Update state in sequence to prevent race conditions
      setSelectedLocation({ latitude: lat, longitude: lng });
      setRegion(newRegion);
      
      // Use setTimeout to ensure state updates are complete before animating
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(newRegion, 1000);
        }
      }, 100);
    } catch (error) {
      console.error('Error handling place selection:', error);
    }
  };

  const handleLongPress = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    setRegion({
      ...region,
      latitude,
      longitude,
    });
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
        <Text style={[styles.headerText, isDark && styles.darkHeaderText]}>
          Explore Listings
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
          onLongPress={handleLongPress}
        >
          {/* {isMapReady && selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              draggable
              onDragEnd={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
              pinColor="blue" // Mark current location with a blue dot
            />
          )} */}
          {mapListings.map((listing) => (
            <Marker
              key={listing.id}
              coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
              onPress={() => setSelectedListing(listing)} // Set selected listing on marker press
              zIndex={selectedListing?.id === listing.id ? 2 : 1} // Bring selected marker to front
            >
              <PriceMarker
                price={listing.price}
                isSelected={selectedListing?.id === listing.id}
              />
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
            <Image source={{ uri: selectedListing.image_urls[0] }} style={styles.listingImage} />
            <View style={styles.listingInfo}>
              <Text style={[styles.listingTitle, isDark && styles.darkListingTitle]}>{selectedListing.title}</Text>
              <Text style={[styles.listingPrice, isDark && styles.darkListingPrice]}>₹{selectedListing.price}</Text>
              <Text style={[styles.listingCity, isDark && styles.darkListingCity]}>{selectedListing.city}</Text>
            </View>
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
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
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
    left: 10,
    right: 10,
    zIndex: 1,
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
    height: '100%',
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
});
