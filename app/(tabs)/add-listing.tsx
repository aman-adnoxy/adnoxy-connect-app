import { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TextInput, Pressable, Image, View as RNView, Alert, ActivityIndicator, SafeAreaView, TouchableOpacity, BackHandler, Modal } from 'react-native'; // Added Modal
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router, useFocusEffect } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker'; // Added DocumentPicker
import * as FileSystem from 'expo-file-system'; // Import FileSystem
import { listingsService } from '@/services/listings';
import { Listing, ListingForDb } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/services/supabase';
import Ionicons from '@expo/vector-icons/Ionicons';
import CustomPlacesSearch from '@/components/CustomPlacesSearch';
import DetailedAddressForm from '@/components/DetailedAddressForm'; // Import the new component
import { MapView, Marker, PROVIDER_GOOGLE } from '../../components/MapView';
import * as Location from 'expo-location';
import { decode } from 'base64-arraybuffer';

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

export default function AddListingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user } = useAuth();
  const mapRef = useRef<any>(null);

  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [disclaimerConfirmed, setDisclaimerConfirmed] = useState(false);
  const [showDetailedAddressForm, setShowDetailedAddressForm] = useState(false); // New state for detailed address form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [images, setImages] = useState<{ uri: string, mimeType: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // New state for error message
  const [region, setRegion] = useState<Region>({
    latitude: 23.0225, // Ahmedabad latitude
    longitude: 72.5714, // Ahmedabad longitude
    latitudeDelta: 0.00196, // 2% extra zoom
    longitudeDelta: 0.00196, // 2% extra zoom
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [displayAddress, setDisplayAddress] = useState('Fetching address...');

  // New state variables for detailed address form
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState(''); // New state for landmark
  const [representativeName, setRepresentativeName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [alternateContactNo, setAlternateContactNo] = useState('');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [unit, setUnit] = useState('');
  const [supportingDocuments, setSupportingDocuments] = useState<string[]>([]);

  // New states for additional fields
  const [listingSourceId, setListingSourceId] = useState('');
  const [lightingType, setLightingType] = useState<'Digital' | 'BL' | 'FL' | 'NL' | undefined>(undefined);
  const [quantity, setQuantity] = useState('');

  // State for dropdown visibility
  const [isCategoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [isUnitPickerVisible, setUnitPickerVisible] = useState(false);
  const [isLightingTypePickerVisible, setLightingTypePickerVisible] = useState(false); // New state for lighting type picker

  const categories = ['Billboard', 'Backlit billboard', 'LED Display', 'Banner'];
  const units = ['cm', 'inches', 'm', 'feet'];
  const lightingTypes = ['Digital', 'BL', 'FL', 'NL']; // Options for lighting_type

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
        setAddress(formattedAddress); // Also update the address state for the form
        setCity(address.city || ''); // Set the city using the geocoded address
      } else {
        setDisplayAddress('Address not found');
        setAddress('');
        setCity(''); // Clear city if address not found
      }
    } catch (error) {
      console.error('Error resolving address:', error);
      setDisplayAddress('Error fetching address');
      setAddress('');
      setCity(''); // Clear city on error
    }
  };

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
        latitudeDelta: 0.00196, // 2% extra zoom
        longitudeDelta: 0.00196, // 2% extra zoom
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

  useFocusEffect(
    useCallback(() => {
      // Removed getCurrentLocation() from here to prevent overriding selected location on focus.
      // It will now only be called when the "current location" button is pressed.

      const onBackPress = () => {
        if (showForm) {
          setShowForm(false);
          setShowDetailedAddressForm(true); // Go back to detailed address form
          return true;
        } else if (showDetailedAddressForm) {
          setShowDetailedAddressForm(false); // Go back to map view
          // Discard detailed address values when physical back button is pressed
          setStreet('');
          setArea('');
          setLandmark(''); // Clear landmark on back
          setRepresentativeName('');
          setContactNo('');
          setAlternateContactNo('');
          return true;
        } else if (!showDisclaimer) { // If on map view
          setShowDisclaimer(true);
          setDisclaimerConfirmed(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [showForm, showDetailedAddressForm, showDisclaimer])
  );

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
    // Do not set displayAddress directly here. Let handleRegionChangeComplete do it.
    setAddress(data.description); // Keep this to populate the form's address field
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Allow any aspect ratio
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImage = { uri: result.assets[0].uri, mimeType: result.assets[0].mimeType || 'application/octet-stream' };
        setImages(prevImages => [...prevImages, newImage]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all document types
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newDocumentUri = result.assets[0].uri;
        setSupportingDocuments(prevDocs => [...prevDocs, newDocumentUri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleRemoveDocument = (index: number) => {
    setSupportingDocuments(prevDocs => prevDocs.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Console log all details
    console.log('Listing Details:', {
      title,
      description,
      price,
      category,
      address,
      city,
      images,
      street,
      area,
      landmark, // Include landmark in console log
      representativeName,
      contactNo,
      alternateContactNo,
      height,
      width,
      unit,
      supportingDocuments,
      listingSourceId,
      lightingType,
      quantity,
      latitude: region.latitude,
      longitude: region.longitude,
    });

    // Validate required fields (supportingDocuments, listingSourceId, lightingType, quantity are optional)
    const parsedHeight = parseFloat(height);
    const parsedWidth = parseFloat(width);
    const parsedPrice = parseFloat(price);
    const parsedQuantity = parseInt(quantity); // Parse quantity as integer

    if (!title || !description || !category || !address || !city ||
        !street || !area || !representativeName || !contactNo || !unit ||
        isNaN(parsedPrice) || parsedPrice <= 0 ||
        isNaN(parsedHeight) || parsedHeight <= 0 ||
        isNaN(parsedWidth) || parsedWidth <= 0) {
      setErrorMessage('Please fill in all required fields and ensure Price, Height, and Width are valid positive numbers.');
      return;
    }

    // Validate image count
    if (images.length < 3 || images.length > 5) {
      setErrorMessage('Please add between 3 and 5 images.');
      return;
    }
    
    // Validate quantity if provided
    if (quantity && (isNaN(parsedQuantity) || parsedQuantity <= 0)) {
      setErrorMessage('Quantity must be a valid positive number if provided.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null); // Clear previous errors

      // Generate a UUID for the listing
      const { data: uuidData, error: uuidError } = await supabase.rpc('generate_uuid_v4');
      if (uuidError) throw uuidError;
      const listingUuid = uuidData;

      // Upload images to storage with UUID path
      const imageUrls = await Promise.all(
        images.map(async (imageObject) => {
          try {
            const response = await fetch(imageObject.uri); // Use imageObject.uri
            const base64 = await FileSystem.readAsStringAsync(imageObject.uri, { encoding: 'base64' });

            const fileExtension = imageObject.mimeType.split('/')[1]; // Use mimeType from object
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
            const { data, error } = await supabase.storage
              .from('listings')
              .upload(`${listingUuid}/images/${fileName}`, decode(base64), {
                contentType: imageObject.mimeType, // Explicitly set content type from object
              });
              
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage
              .from('listings')
              .getPublicUrl(`${listingUuid}/images/${fileName}`);
            return publicUrl;
          } catch (uploadError: any) {
            console.error(`Error uploading image ${imageObject.uri}:`, uploadError);
            setErrorMessage(`Error uploading image: ${uploadError.message || 'Network request failed'}`);
            throw uploadError;
          }
        })
      );

      // Upload supporting documents to storage with UUID path (if any)
      const documentUrls = await Promise.all(
        supportingDocuments.map(async (docUri) => {
          const response = await fetch(docUri);
          const base64 = await FileSystem.readAsStringAsync(docUri, { encoding: 'base64' }); // Changed to base64
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${docUri.split('.').pop()}`;
          const { data, error } = await supabase.storage
            .from('listings')
            .upload(`${listingUuid}/documents/${fileName}`, decode(base64), { contentType: 'application/octet-stream' }); // Changed to base64 upload with content type
              
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage
            .from('listings') // Changed bucket name
            .getPublicUrl(`${listingUuid}/documents/${fileName}`); // Corrected public URL path
          return publicUrl;
        })
      );

      // Create listing object conforming to ListingForDb type for database insertion
      const listingData: ListingForDb = {
        id: listingUuid, // Use the generated UUID as the listing ID
        user_id: user.id,
        title,
        height: parsedHeight,
        width: parsedWidth,
        unit,
        lighting_type: lightingType, // Add new field
        quantity: quantity ? parsedQuantity : undefined, // Add new field, ensure it's number or undefined
        description,
        price: parseFloat(price),
        category,
        address,
        city,
        image_urls: imageUrls,
        supporting_documents: documentUrls,
        verification_status: 'pending',
        latitude: region.latitude,
        longitude: region.longitude,
        // Add new detailed address fields
        street: street,
        area: area,
        landmark: landmark === '' ? undefined : landmark, // Add new landmark field, set to undefined if empty
        representative_name: representativeName,
        contact_no: contactNo,
        alternate_contact_no: alternateContactNo === '' ? null : alternateContactNo,
        listing_source_id: listingSourceId, // Add new field
      };

      console.log('Listing to save:', listingData);
      await listingsService.createListing(listingData);
      
      // Show success alert for 2 seconds
      const successAlert = Alert.alert(
        'Success',
        'Listing created successfully!',
        [],
        { cancelable: false }
      );
      
      // Wait for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      router.push('/');
    } catch (error: any) {
      console.error('Full error creating listing:', error);
      setErrorMessage(error.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const renderImageTile = (imageObject?: { uri: string, mimeType: string }, index?: number) => {
    const isPlaceholder = !imageObject;
    const showAddButton = isPlaceholder && images.length < 5; // Only show add button if it's a placeholder and less than 5 images

    return (
      <RNView 
        key={imageObject?.uri || `placeholder-${index}`}
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
        ) : imageObject?.uri ? (
          <RNView style={styles.imageContainer}>
            <Image source={{ uri: imageObject.uri }} style={styles.image} resizeMode="contain" />
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

  if (showDisclaimer) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={[styles.mapScreenHeader, isDark && { backgroundColor: Colors.dark.background, borderBottomColor: Colors.dark.border }]}>

          <TouchableOpacity
            style={styles.backButton} // Reusing backButton style for consistency
            onPress={() => router.back()} // Cross button also goes back
          >
            <Ionicons name="close" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.disclaimerContentContainer}>
          {/* New container for content below header */}
          <Text style={[Typography.h2, styles.disclaimerPrompt, isDark && styles.darkTitle]}>
            Are you the legal owner or authorized representative for this listing?
          </Text>
          <Text style={[Typography.body2, styles.disclaimerText, isDark && styles.darkLabel]}>
            Disclaimer: Any false representation may lead to legal action and removal of the listing.
          </Text>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setDisclaimerConfirmed(!disclaimerConfirmed)}
          >
            <View style={[styles.checkbox, disclaimerConfirmed && styles.checkboxChecked]}>
              {disclaimerConfirmed && <Ionicons name="checkmark" size={20} color="#fff" />}
            </View>
            <Text style={[Typography.body1, styles.checkboxLabel, isDark && styles.darkLabel]}>
              Yes, I confirm
            </Text>
          </TouchableOpacity>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.backButtonDisclaimer]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: tintColor }, !disclaimerConfirmed && { opacity: 0.5 }]}
              onPress={() => {
                if (disclaimerConfirmed) {
                  setShowDisclaimer(false);
                  getCurrentLocation(); // Reanimate map to current location when proceeding from disclaimer
                } else {
                  Alert.alert('Confirmation Required', 'Please confirm that you are the legal owner or authorized representative.');
                }
              }}
              disabled={!disclaimerConfirmed}
            >
              <Text style={styles.buttonText}>Proceed</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!showForm) { // This block now handles both map view and detailed address form
    if (showDetailedAddressForm) {
      return (
        <DetailedAddressForm
          street={street}
          setStreet={setStreet}
          area={area}
          setArea={setArea}
          landmark={landmark} // Pass landmark prop
          setLandmark={setLandmark} // Pass setLandmark prop
          representativeName={representativeName}
          setRepresentativeName={setRepresentativeName}
          contactNo={contactNo}
          setContactNo={setContactNo}
          alternateContactNo={alternateContactNo}
          setAlternateContactNo={setAlternateContactNo}
          onConfirm={() => setShowForm(true)} // Navigate to main listing form
          onBack={() => {
            setShowDetailedAddressForm(false); // Go back to map view
            getCurrentLocation(); // Reanimate map to current location
            // Discard detailed address values
            setStreet('');
            setArea('');
            setLandmark(''); // Clear landmark on back
            setRepresentativeName('');
            setContactNo('');
            setAlternateContactNo('');
          }}
          displayAddress={displayAddress}
        />
      );
    }

    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={[styles.mapScreenHeader, isDark && { backgroundColor: Colors.dark.background, borderBottomColor: Colors.dark.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowDisclaimer(true)} // Go back to disclaimer
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
            onRegionChangeComplete={handleRegionChangeComplete} // Use handleRegionChangeComplete
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
              googlePlacesApiKey="AIzaSyDBu0mE3-x_rXqwjf1eUej7-7YDjhvbMPs"
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
            style={[styles.confirmLocationButton, { backgroundColor: tintColor }]}
            onPress={() => {
              if (displayAddress === 'Fetching address...' || displayAddress === 'Address not found' || displayAddress === 'Error fetching address') {
                Alert.alert('Location Required', 'Please wait for the location to be detected or try selecting a different location.');
                return;
              }
              setShowDetailedAddressForm(true);
            }}
          >
            <Text style={styles.confirmLocationText}>Confirm Location & Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowForm(false)}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </TouchableOpacity>
        <Text style={[Typography.h2, styles.title, isDark && styles.darkTitle]}>
          Add the details
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={[styles.formContainer, isDark && styles.darkFormContainer]}>
          {/* Custom Loader Modal */}
          <Modal
            transparent={true}
            animationType="fade"
            visible={loading}
            onRequestClose={() => {}} // Prevent closing with back button
          >
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color={tintColor} />
              <Text style={styles.loaderText}>Creating Listing...</Text>
            </View>
          </Modal>

          <View style={styles.imageSection}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>
              Images ({images.length}/5)
            </Text>
            <View style={styles.imageGrid}>
              {loading && (
                <RNView style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={tintColor} />
                </RNView>
              )}
              <View style={styles.gridRow}>
                {images.map((imageObject, index) => renderImageTile(imageObject, index))}
                {images.length < 5 && renderImageTile(undefined, images.length)} {/* Show add button only if less than 5 images */}
              </View>
            </View>
          </View>

          {/* New Listing Source ID field */}
          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Listing Source ID</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={listingSourceId}
              onChangeText={setListingSourceId}
              placeholder="Enter listing source ID"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
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
            <Pressable
              style={[styles.input, styles.dropdownInput, isDark && styles.darkInput]}
              onPress={() => setCategoryPickerVisible(true)}
            >
              <Text style={[styles.dropdownText, category ? (isDark ? styles.darkText : styles.lightText) : (isDark ? styles.darkPlaceholder : styles.lightPlaceholder)]}>
                {category || 'Select category'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={isDark ? '#666' : '#999'} />
            </Pressable>
            <Modal
              transparent={true}
              visible={isCategoryPickerVisible}
              onRequestClose={() => setCategoryPickerVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setCategoryPickerVisible(false)}>
                <View style={[styles.dropdownContainer, isDark && styles.darkDropdownContainer]}>
                  {categories.map((cat, index) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.dropdownItem, index === categories.length - 1 && styles.lastDropdownItem]}
                      onPress={() => {
                        setCategory(cat);
                        setCategoryPickerVisible(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, isDark && styles.darkDropdownItemText]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          </View>

          {/* New Size fields */}
          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Size</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.thirdInput, isDark && styles.darkInput]}
                value={height}
                onChangeText={setHeight}
                placeholder="Height"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.thirdInput, { marginLeft: 10 }, isDark && styles.darkInput]}
                value={width}
                onChangeText={setWidth}
                placeholder="Width"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="numeric"
              />
             <Pressable
              style={[styles.input, styles.thirdInput, { marginLeft: 10 }, styles.dropdownInput, isDark && styles.darkInput]}
              onPress={() => setUnitPickerVisible(true)}
            >
              <Text style={[styles.dropdownText, unit ? (isDark ? styles.darkText : styles.lightText) : (isDark ? styles.darkPlaceholder : styles.lightPlaceholder)]}>
                {unit || 'Unit'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={isDark ? '#666' : '#999'} />
            </Pressable>
            <Modal
              transparent={true}
              visible={isUnitPickerVisible}
              onRequestClose={() => setUnitPickerVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setUnitPickerVisible(false)}>
                <View style={[styles.dropdownContainer, isDark && styles.darkDropdownContainer]}>
                  {units.map((u, index) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.dropdownItem, index === units.length - 1 && styles.lastDropdownItem]}
                      onPress={() => {
                        setUnit(u);
                        setUnitPickerVisible(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, isDark && styles.darkDropdownItemText]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
            </View>
          </View>

          {/* New Lighting Type field (Dropdown) */}
          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Lighting Type (Optional)</Text>
            <Pressable
              style={[styles.input, styles.dropdownInput, isDark && styles.darkInput]}
              onPress={() => setLightingTypePickerVisible(true)}
            >
              <Text style={[styles.dropdownText, lightingType ? (isDark ? styles.darkText : styles.lightText) : (isDark ? styles.darkPlaceholder : styles.lightPlaceholder)]}>
                {lightingType || 'Select lighting type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={isDark ? '#666' : '#999'} />
            </Pressable>
            <Modal
              transparent={true}
              visible={isLightingTypePickerVisible}
              onRequestClose={() => setLightingTypePickerVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setLightingTypePickerVisible(false)}>
                <View style={[styles.dropdownContainer, isDark && styles.darkDropdownContainer]}>
                  {lightingTypes.map((type, index) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.dropdownItem, index === lightingTypes.length - 1 && styles.lastDropdownItem]}
                      onPress={() => {
                        setLightingType(type as 'Digital' | 'BL' | 'FL' | 'NL');
                        setLightingTypePickerVisible(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, isDark && styles.darkDropdownItemText]}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Modal>
          </View>

          {/* New Quantity field */}
          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Quantity (Optional)</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="numeric"
            />
          </View>

          {/* Existing Supporting Documents section */}
          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>
              Supporting Documents
            </Text>
            <View style={styles.documentList}>
              {supportingDocuments.map((docUri, index) => (
                <RNView key={index} style={[styles.documentTile, isDark && styles.darkDocumentTile]}>
                  <Ionicons name="document-text-outline" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
                  <Text style={[styles.documentName, isDark && styles.darkDocumentName]} numberOfLines={1}>
                    {docUri.split('/').pop()}
                  </Text>
                  <Pressable onPress={() => handleRemoveDocument(index)} style={styles.removeDocumentButton}>
                    <Ionicons name="close-circle" size={20} color="red" />
                  </Pressable>
                </RNView>
              ))}
              <Pressable
                onPress={handlePickDocument}
                style={({ pressed }) => [
                  styles.addDocumentButton,
                  { opacity: pressed ? 0.7 : 1 },
                  isDark && styles.darkAddDocumentButton,
                ]}
              >
                <FontAwesome name="plus" size={20} color={isDark ? Colors.dark.text : Colors.light.text} />
                <Text style={[styles.addDocumentButtonText, isDark && styles.darkAddDocumentButtonText]}>
                  Add Document
                </Text>
              </Pressable>
            </View>
          </View>

          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

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
    backgroundColor: Colors.light.background, // Use Colors for consistency
  },
  darkContainer: {
    backgroundColor: Colors.dark.background, // Use Colors for consistency
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 80, // Adjusted padding to account for sticky header height
    paddingBottom: 20,
  },
  formContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkFormContainer: {
    backgroundColor: Colors.dark.cardBackground,
  },
  header: {
    position: 'absolute', // Make header sticky
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, // Add horizontal padding back for the header itself
    height: 80, // Increased height for better visual
    backgroundColor: Colors.light.background, // Set background color for sticky header
    zIndex: 10, // Ensure header is on top
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingTop: 40, // Adjust for SafeAreaView
  },
  darkHeader: {
    backgroundColor: Colors.dark.background,
    borderBottomColor: Colors.dark.border,
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
  title: {
    flex: 1,
    textAlign: 'center',
    color: Colors.light.text, // Use Colors for consistency
  },
  darkTitle: {
    color: Colors.dark.text, // Use Colors for consistency
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
  inputGroup: {
    marginBottom: 20, // Increased margin bottom for better spacing
    backgroundColor: 'transparent',
  },
  label: {
    marginBottom: 8,
    color: Colors.light.text, // Use Colors for consistency
    fontWeight: '600', // Make labels slightly bolder
  },
  darkLabel: {
    color: Colors.dark.text, // Use Colors for consistency
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border, // Use Colors for consistency
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text, // Use Colors for consistency
    backgroundColor: Colors.light.inputBackground, // New color for input background
  },
  darkInput: {
    borderColor: Colors.dark.border, // Use Colors for consistency
    color: Colors.dark.text, // Use Colors for consistency
    backgroundColor: Colors.dark.inputBackground, // New color for dark input background
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20, // Increased margin top
  },
  submitButtonText: {
    color: '#fff', // Assuming white text on colored button
    fontSize: 18, // Slightly larger font
    fontWeight: '700', // Bolder font
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
    justifyContent: 'flex-start', // Changed to flex-start to allow images to flow naturally
    marginHorizontal: -5, // Adjusted margin for spacing
  },
  imageTile: {
    width: '48%', // Adjusted width for two columns with spacing
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginVertical: 5, // Added vertical margin
    marginHorizontal: 5, // Added horizontal margin
    paddingBottom: '48%', // Maintain aspect ratio for the tile itself
    position: 'relative',
  },
  darkImageTile: {
    backgroundColor: Colors.dark.cardBackground,
    borderColor: Colors.dark.border,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.textSecondary, // Use Colors for consistency
  },
  darkAddButtonText: {
    color: Colors.dark.textSecondary, // Use Colors for consistency
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Changed resizeMode to contain
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateInput: {
    justifyContent: 'center',
  },
  dateText: {
    color: Colors.light.text,
    fontSize: 16,
  },
  darkDateText: {
    color: Colors.dark.text,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 400,
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
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
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  searchInput: {
    height: 48,
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  darkSearchInput: {
    backgroundColor: Colors.dark.inputBackground,
    color: Colors.dark.text,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.tint, // Use Colors for consistency
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
    backgroundColor: Colors.light.tint, // Use Colors for consistency
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
    borderColor: Colors.light.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
  },
  darkMapButton: {
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.inputBackground,
  },
  mapButtonText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  darkMapButtonText: {
    color: Colors.dark.text,
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
  disclaimerPrompt: {
    textAlign: 'center',
    marginBottom: 16,
  },
  disclaimerText: {
    textAlign: 'center',
    marginBottom: 24,
    color: Colors.light.textSecondary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 16,
  },
  backButtonDisclaimer: {
    backgroundColor: Colors.light.textSecondary, // Use a neutral color
    flex: 1,
    marginRight: 8,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimerContentContainer: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    width: '31%', // Adjusted width for three columns with spacing
  },
  dropdownInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  lightText: {
    color: Colors.light.text,
  },
  darkText: {
    color: Colors.dark.text,
  },
  lightPlaceholder: {
    color: '#999',
  },
  darkPlaceholder: {
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dropdownContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    width: '80%',
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  darkDropdownContainer: {
    backgroundColor: Colors.dark.cardBackground,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  lastDropdownItem: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  darkDropdownItemText: {
    color: Colors.dark.text,
  },
  documentList: {
    marginTop: 8,
  },
  documentTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  darkDocumentTile: {
    backgroundColor: Colors.dark.cardBackground,
  },
  documentName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: Colors.light.text,
  },
  darkDocumentName: {
    color: Colors.dark.text,
  },
  removeDocumentButton: {
    marginLeft: 10,
    padding: 4,
  },
  addDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  darkAddDocumentButton: {
    backgroundColor: Colors.dark.inputBackground,
    borderColor: Colors.dark.border,
  },
  addDocumentButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  darkAddDocumentButtonText: {
    color: Colors.dark.text,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  loaderOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  loaderText: {
    marginTop: 10,
    color: '#fff',
    fontSize: 16,
  },
});
