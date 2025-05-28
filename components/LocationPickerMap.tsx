import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import Ionicons from '@expo/vector-icons/Ionicons';
import { MapView, Marker, PROVIDER_GOOGLE } from './MapView';
import * as Location from 'expo-location';
import CustomPlacesSearch from './CustomPlacesSearch';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
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

interface LocationPickerMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  initialGoogleLocation?: string;
  onLocationSelect: (latitude: number, longitude: number, google_location: string) => void;
  onClose: () => void;
}

export default function LocationPickerMap({ initialLatitude, initialLongitude, initialGoogleLocation, onLocationSelect, onClose }: LocationPickerMapProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const mapRef = useRef<any>(null);

  const [region, setRegion] = useState<Region>({
    latitude: initialLatitude || 23.0225, // Ahmedabad latitude
    longitude: initialLongitude || 72.5714, // Ahmedabad longitude
    latitudeDelta: 0.00196, // 2% extra zoom
    longitudeDelta: 0.00196, // 2% extra zoom
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [displayAddress, setDisplayAddress] = useState('Detecting Location...');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isLocationDetected, setIsLocationDetected] = useState(false); // New state

  const resolveAddress = async (lat: number, lng: number) => {
    try {
      const geocodedAddress = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocodedAddress && geocodedAddress.length > 0) {
        const address = geocodedAddress[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.postalCode,
          address.country,
        ].filter(Boolean).join(', ');
        setDisplayAddress(formattedAddress);
        setSelectedAddress(formattedAddress);
        setSelectedCity(address.city || '');
        setIsLocationDetected(true); // Location detected
      } else {
        setDisplayAddress('Address not found');
        setSelectedAddress('');
        setSelectedCity('');
        setIsLocationDetected(false); // Location not detected
      }
    } catch (error) {
      console.error('Error resolving address:', error);
      setDisplayAddress('Error fetching address');
      setSelectedAddress('');
      setSelectedCity('');
      setIsLocationDetected(false); // Location not detected
    }
  };

  useEffect(() => {
    // Resolve address for initial region on component mount
    // No need to call resolveAddress here, getCurrentLocation will handle it
    // Animate to current location initially
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to show your current location');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const { latitude, longitude } = location.coords;
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.00196,
        longitudeDelta: 0.00196,
      };
      setRegion(newRegion);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
      resolveAddress(latitude, longitude);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    resolveAddress(newRegion.latitude, newRegion.longitude);
  };

  const handlePlaceSelect = (data: GooglePlaceData, details: GooglePlaceDetail | null) => {
    if (!details) return;
    
    const { lat, lng } = details.geometry.location;
    const newRegion = {
      ...region,
      latitude: lat,
      longitude: lng,
    };
    setRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
    // resolveAddress will be called by handleRegionChangeComplete
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.mapScreenHeader, isDark && { backgroundColor: Colors.dark.background, borderBottomColor: Colors.dark.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </TouchableOpacity>
        <Text style={[Typography.h2, styles.headerTitle, isDark && styles.darkHeaderTitle]}>
          Add the location
        </Text>
      </View>

      <View style={styles.mapViewContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChangeComplete}
          onMapReady={() => setIsMapReady(true)}
          showsUserLocation
        >
        </MapView>
        <Ionicons name="location" size={40} color="red" style={styles.fixedMarker} />
        <TouchableOpacity
          style={[styles.currentLocationButton, { backgroundColor: tintColor }]}
          onPress={getCurrentLocation}
        >
          <Ionicons name="locate" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBarContainer}>
          <CustomPlacesSearch
            onPlaceSelected={handlePlaceSelect}
            googlePlacesApiKey="AIzaSyDBu0mE3-x_rXqwjf1eUej7-7YDjhvbMPs" // TODO: Make this configurable or use environment variable
            initialRegion={region}
          />
        </View>
      </View>

      <View style={[styles.footerContainer, isDark && styles.darkFooterContainer]}>
        <Text style={[Typography.body1, styles.footerAddressLabel, isDark ? { color: Colors.dark.textSecondary } : { color: Colors.light.textSecondary }]}>
          Selected Location:
        </Text>
        <Text style={[Typography.h3, styles.footerAddressText, isDark ? { color: Colors.dark.text } : { color: Colors.light.text }]} numberOfLines={2}>
          {displayAddress}
        </Text>
        <TouchableOpacity
          style={[styles.confirmLocationButton, { backgroundColor: tintColor }, !isLocationDetected && { opacity: 0.5 }]}
          onPress={() => {
            if (!isLocationDetected) {
              Alert.alert('Location Required', 'Please wait for the location to be detected or try selecting a different location.');
              return;
            }
            onLocationSelect(region.latitude, region.longitude, displayAddress);
          }}
          disabled={!isLocationDetected} // Disable button until location is detected
        >
          <Text style={styles.confirmLocationText}>
            {isLocationDetected ? 'Confirm Location & Continue' : 'Detecting Location...'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
  mapScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.light.background,
    paddingTop: 40,
    paddingBottom: 10,
  },
  searchBarContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    zIndex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mapViewContainer: {
    flex: 1,
  },
  footerContainer: {
    backgroundColor: Colors.light.background,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    paddingBottom: 80,
  },
  darkFooterContainer: {
    backgroundColor: Colors.dark.background,
  },
  footerAddressLabel: {
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontSize: 14,
  },
  footerAddressText: {
    marginBottom: 16,
    color: Colors.light.text,
  },
  darkFooterAddressText: {
    color: Colors.dark.text,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: Colors.light.text,
    marginLeft: 10,
    marginRight: 10,
  },
  darkHeaderTitle: {
    color: Colors.dark.text,
  },
  fixedMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 1,
    transform: [{ translateX: -20 }, { translateY: -40 }],
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmLocationButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmLocationText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
