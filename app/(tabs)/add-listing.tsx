import { useState, useRef, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, Pressable, Image, View as RNView, Alert, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomPlacesSearch from '@/components/CustomPlacesSearch';
import { MapView, Marker, PROVIDER_GOOGLE } from '../../components/MapView';
import * as Location from 'expo-location';

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

const MAX_IMAGES = 5;

export default function AddListingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user } = useAuth();
  const mapRef = useRef<any>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState<Region>({
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isMapReady, setIsMapReady] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="lock-closed-outline" size={64} color={isDark ? '#888' : '#bbb'} style={{ marginBottom: 24 }} />
          <Text style={{ color: isDark ? '#fff' : '#222', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
            Please sign in to view this page
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: tintColor, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 }}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleMarkerDragEnd = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setRegion({
      ...region,
      latitude,
      longitude,
    });
  };

  const handlePlaceSelect = (data: GooglePlaceData, details: GooglePlaceDetail | null) => {
    if (!details) return;
    
    const { lat, lng } = details.geometry.location;
    setRegion({
      ...region,
      latitude: lat,
      longitude: lng,
    });
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    setAddress(data.description);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImage = result.assets[0].uri;
        setImages(prevImages => {
          const currentImages = prevImages || [];
          return [...currentImages, newImage];
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prevImages => {
      const currentImages = prevImages || [];
      return currentImages.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!title || !description || !price || !category || !address || !city || !images || images.length === 0) {
      Alert.alert('Error', 'Please fill in all fields and add at least one image');
      return;
    }

    try {
      setLoading(true);

      // Upload images to storage
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const response = await fetch(image);
          const blob = await response.blob();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
          const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(fileName, blob);
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName);
          return publicUrl;
        })
      );

      // Create listing
      const listing: Omit<Listing, 'id' | 'created_at'> = {
        user_id: user.id,
        title,
        description,
        price: parseFloat(price),
        category,
        address,
        city,
        image_urls: imageUrls,
        verification_status: 'pending',
        latitude: region.latitude,
        longitude: region.longitude,
      };

      await listingsService.createListing(listing);
      Alert.alert('Success', 'Listing created successfully');
      router.push('/my-listings');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const renderImageTile = (uri?: string, index?: number) => {
    const currentImages = images || [];
    const isPlaceholder = !uri;
    const isLast = index === currentImages.length;
    const showAddButton = isPlaceholder && isLast && currentImages.length < MAX_IMAGES;

    return (
      <RNView 
        key={uri || 'placeholder'}
        style={[
          styles.imageTile,
          isDark && styles.darkImageTile,
          styles.shadow
        ]}
      >
        {showAddButton ? (
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.addButton,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <FontAwesome name="plus" size={32} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.addButtonText, isDark && styles.darkAddButtonText]}>
              Add Photo
            </Text>
          </Pressable>
        ) : uri ? (
          <RNView style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
            <Pressable
              onPress={() => handleRemoveImage(index!)}
              style={({ pressed }) => [
                styles.removeButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <FontAwesome name="times" size={20} color="#fff" />
            </Pressable>
          </RNView>
        ) : null}
      </RNView>
    );
  };

  if (!showForm) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[Typography.h2, styles.title, isDark && styles.darkTitle]}>
            Select Location
          </Text>
        </View>

        <View style={styles.mapContainer}>
          <CustomPlacesSearch
            onPlaceSelected={handlePlaceSelect}
            googlePlacesApiKey="AIzaSyDBu0mE3-x_rXqwjf1eUej7-7YDjhvbMPs"
            initialRegion={region}
          />
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            onRegionChangeComplete={setRegion}
            onMapReady={() => setIsMapReady(true)}
          >
            {isMapReady && (
              <Marker
                coordinate={{
                  latitude: region.latitude,
                  longitude: region.longitude,
                }}
                draggable
                onDragEnd={handleMarkerDragEnd}
              />
            )}
          </MapView>
          <TouchableOpacity
            style={[styles.currentLocationButton, { backgroundColor: tintColor }]}
            onPress={getCurrentLocation}
          >
            <Ionicons name="locate" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmLocationButton, { backgroundColor: tintColor }]}
            onPress={() => setShowForm(true)}
          >
            <Text style={styles.confirmLocationText}>Continue to Listing Details</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (    
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowForm(false)}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[Typography.h2, styles.title, isDark && styles.darkTitle]}>
            Add New Listing
          </Text>
        </View>

        <View style={[styles.formContainer, isDark && styles.darkFormContainer]}>
          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Location</Text>
            <TouchableOpacity
              style={[styles.mapButton, isDark && styles.darkMapButton]}
              onPress={() => setShowForm(false)}
            >
              <Text style={[styles.mapButtonText, isDark && styles.darkMapButtonText]}>
                {address || 'Change Location'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageSection}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>
              Images (3-5 required)
            </Text>
            <View style={styles.imageGrid}>
              {loading && (
                <RNView style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={tintColor} />
                </RNView>
              )}
              <View style={styles.gridRow}>
                {(images || []).map((uri, index) => renderImageTile(uri, index))}
                {(images || []).length < MAX_IMAGES && renderImageTile(undefined, (images || []).length)}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Title</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter listing title"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, isDark && styles.darkInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter listing description"
              placeholderTextColor={isDark ? '#666' : '#999'}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Price</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={price}
              onChangeText={setPrice}
              placeholder="Enter price"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Category</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={category}
              onChangeText={setCategory}
              placeholder="Enter category"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              { backgroundColor: tintColor },
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Create Listing</Text>
            )}
          </Pressable>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
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
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkFormContainer: {
    backgroundColor: '#1c1c1c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#000',
  },
  darkTitle: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  label: {
    marginBottom: 8,
    color: '#000',
  },
  darkLabel: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  darkInput: {
    borderColor: '#333',
    color: '#fff',
    backgroundColor: '#2a2a2a',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  imageGrid: {
    backgroundColor: 'transparent',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    backgroundColor: 'transparent',
    marginHorizontal: -4, // Compensate for tile margin
  },
  imageTile: {
    width: '48%',
    aspectRatio: 8/9,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    margin: '1%',
  },
  darkImageTile: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  addButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  darkAddButtonText: {
    color: '#999',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    color: '#000',
    fontSize: 16,
  },
  darkDateText: {
    color: '#fff',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    height: 400,
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
  searchInput: {
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  darkSearchInput: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  darkMapButton: {
    borderColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  mapButtonText: {
    fontSize: 16,
    color: '#000',
  },
  darkMapButtonText: {
    color: '#fff',
  },
  webMapPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webMapText: {
    textAlign: 'center',
    color: '#666',
  },
});
