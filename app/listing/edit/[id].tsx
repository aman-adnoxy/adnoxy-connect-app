import { StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity, Dimensions, Image, Pressable, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Import SafeAreaView
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';
import { Button, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { MapView, Marker } from '@/components/MapView.native'; // Keep MapView and Marker for the modal
import StaticMapView from '@/components/StaticMapView'; // Import StaticMapView
import LocationPickerMap from '@/components/LocationPickerMap'; // Import LocationPickerMap
import DetailedAddressForm from '@/components/DetailedAddressForm'; // Import DetailedAddressForm
import ImagePickerComponent from '@/components/ImagePickerComponent'; // Import ImagePickerComponent
import DocumentPickerComponent from '@/components/DocumentPickerComponent'; // Import DocumentPickerComponent
import DateTimePicker from '@react-native-community/datetimepicker';
import ListingDetailsScreen from '@/app/listing/[id]'; // Import ListingDetailsScreen

const { width: screenWidth } = Dimensions.get('window');

export default function EditListingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const listingId = typeof id === 'string' ? id : '';
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false); // State for location picker modal
  const [isDetailedAddressModalVisible, setIsDetailedAddressModalVisible] = useState(false); // New state for detailed address form modal
  const [selectedCardData, setSelectedCardData] = useState<any>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    address: '',
    latitude: 0, // Added latitude
    longitude: 0, // Added longitude
    google_location: '', // Added google_location
    availability_start: '',
    availability_end: '',
    image_urls: [] as string[],
    is_unavailable: false, // New field for marking unavailable
    listing_source_id: '', // New field
    lighting_type: '', // New field
    height: '', // Changed from size
    width: '', // Changed from size
    unit: '', // Changed from size
    quantity: '', // New field
    supporting_documents: [] as string[], // New field
  });

  const [modalImages, setModalImages] = useState<{ uri: string, mimeType: string }[]>([]);
  const [modalSupportingDocuments, setModalSupportingDocuments] = useState<{ uri: string, mimeType: string }[]>([]);

  // New state variables for DetailedAddressForm
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [alternateContactNo, setAlternateContactNo] = useState('');

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [isViewListingModalVisible, setIsViewListingModalVisible] = useState(false);

  // New states for dropdown visibility
  const [isUnitPickerVisible, setUnitPickerVisible] = useState(false);
  const units = ['cm', 'inches', 'm', 'feet'];

  useEffect(() => {
    if (listingId) {
      loadListingDetails(listingId);
    }
  }, [listingId]);

  const loadListingDetails = async (id: string) => {
    try {
      setLoading(true);
      const fetchedListing = await listingsService.getListingById(id);
      if (fetchedListing) {
        setListing(fetchedListing);
        setFormData({
          title: fetchedListing.title,
          description: fetchedListing.description || '',
          price: fetchedListing.price.toString(),
          category: fetchedListing.category,
          address: fetchedListing.address || '',
          latitude: fetchedListing.latitude || 0, // Initialize latitude
          longitude: fetchedListing.longitude || 0, // Initialize longitude
          google_location: fetchedListing.google_location || '', // Initialize google_location
          availability_start: fetchedListing.availability_start as string || '',
          availability_end: fetchedListing.availability_end as string || '',
          image_urls: fetchedListing.image_urls || [],
          is_unavailable: fetchedListing.is_unavailable || false, // Initialize new field
          listing_source_id: fetchedListing.listing_source_id || '',
          lighting_type: fetchedListing.lighting_type || '',
          height: fetchedListing.height?.toString() || '', // Initialize height
          width: fetchedListing.width?.toString() || '', // Initialize width
          unit: fetchedListing.unit || '', // Initialize unit
          quantity: fetchedListing.quantity?.toString() || '', // Convert to string
          supporting_documents: fetchedListing.supporting_documents || [],
        });
        // Attempt to parse address into detailed fields if possible
        // This is a simplified example; a real implementation might need a more robust parsing logic
        const addressParts = fetchedListing.address ? fetchedListing.address.split(', ') : [];
        setStreet(addressParts[0] || '');
        setArea(addressParts[1] || '');
        setLandmark(addressParts[2] || ''); // Assuming landmark is the third part
        // Representative name, contact no, alternate contact no are not part of the listing address
        // They would need to be stored separately in the listing object or derived from user profile
        // For now, initialize them as empty or from a placeholder
        setRepresentativeName('');
        setContactNo('');
        setAlternateContactNo('');
      } else {
        Alert.alert('Error', 'Listing not found.');
        router.back();
      }
    } catch (error) {
      console.error('Error loading listing details:', error);
      Alert.alert('Error', 'Failed to load listing details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | string[] | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowStartDatePicker(Platform.OS === 'ios');
    handleInputChange('availability_start', currentDate.toISOString().split('T')[0]);
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowEndDatePicker(Platform.OS === 'ios');
    handleInputChange('availability_end', currentDate.toISOString().split('T')[0]);
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, isDark && styles.darkText]}>
          Listing details could not be loaded.
        </Text>
      </View>
    );
  }

  const openEditModal = (cardType: string, data: any) => {
    setSelectedCardData({ cardType, data });
    setIsModalVisible(true);
    if (cardType === 'location') {
      // When opening the location modal, initialize detailed address fields
      const addressParts = formData.address ? formData.address.split(', ') : [];
      setStreet(addressParts[0] || '');
      setArea(addressParts[1] || '');
      setLandmark(addressParts[2] || '');
      // These fields are not part of the listing address, so they remain empty or from a default source
      setRepresentativeName('');
      setContactNo('');
      setAlternateContactNo('');
    } else if (cardType === 'photoTour' || cardType === 'imageUrls') {
      setModalImages(data.image_urls.map((uri: string) => ({ uri, mimeType: 'application/octet-stream' }))); // Assuming default mimeType for existing images
    } else if (cardType === 'supportingDocuments') {
      setModalSupportingDocuments(data.supporting_documents.map((uri: string) => ({ uri, mimeType: 'application/octet-stream' }))); // Assuming default mimeType for existing documents
    } else if (cardType === 'size') {
      setSelectedCardData((prev: any) => ({
        ...prev,
        data: {
          height: formData.height,
          width: formData.width,
          unit: formData.unit,
        },
      }));
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedCardData(null);
  };

  const handleModalSave = async (updatedData: any) => {
    if (!user || !listingId) {
      Alert.alert('Error', 'User not authenticated or listing ID is missing.');
      return;
    }

    setModalSaving(true);
    try {
      let updatePayload: Partial<Listing> = {};

      switch (selectedCardData.cardType) {
        case 'photoTour':
        case 'imageUrls': // Both use image_urls
          updatePayload = { image_urls: updatedData.image_urls };
          break;
        case 'title':
          updatePayload = { title: updatedData.title };
          break;
        case 'description':
          updatePayload = { description: updatedData.description };
          break;
        case 'category':
          updatePayload = { category: updatedData.category };
          break;
        case 'pricing':
          updatePayload = { price: parseFloat(updatedData.price) };
          break;
        case 'availability':
          updatePayload = {
            availability_start: updatedData.availability_start,
            availability_end: updatedData.availability_end,
            is_unavailable: updatedData.is_unavailable, // Include this if it's part of availability
          };
          break;
        case 'location':
          updatePayload = {
            street: updatedData.street,
            area: updatedData.area,
            landmark: updatedData.landmark === '' ? null : updatedData.landmark, // Set to null if empty
            representative_name: updatedData.representative_name,
            contact_no: updatedData.contact_no,
            alternate_contact_no: updatedData.alternate_contact_no === '' ? null : updatedData.alternate_contact_no, // Set to null if empty
            latitude: updatedData.latitude, // Removed as per user feedback
            longitude: updatedData.longitude, // Removed as per user feedback
            google_location: updatedData.google_location, // Removed as per user feedback
          };
          break;
        case 'listingSourceId':
          updatePayload = { listing_source_id: updatedData.listing_source_id };
          break;
        case 'lightingType':
          updatePayload = { lighting_type: updatedData.lighting_type };
          break;
        case 'size':
          updatePayload = {
            height: parseFloat(updatedData.height),
            width: parseFloat(updatedData.width),
            unit: updatedData.unit,
          };
          break;
        case 'quantity':
          updatePayload = { quantity: updatedData.quantity };
          break;
        case 'supportingDocuments':
          updatePayload = { supporting_documents: updatedData.supporting_documents.map((doc: { uri: string, mimeType: string }) => doc.uri) };
          break;
        default:
          break;
      }

      await listingsService.updateListing(listingId, updatePayload);
      Alert.alert('Success', 'Listing updated successfully!');
      await loadListingDetails(listingId); // Refresh the main screen's data
      closeModal();
    } catch (error) {
      console.error('Error saving listing:', error);
      Alert.alert('Error', 'Failed to save listing. Please try again.');
    } finally {
      setModalSaving(false);
    }
  };

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </Pressable>
        <Text style={[styles.title, isDark && styles.darkText]}>Listing editor</Text>
        <Pressable style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Photo tour card */}
        <Pressable onPress={() => openEditModal('photoTour', { image_urls: formData.image_urls })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Photo tour</Text>
          <Text style={[styles.cardSubtitle, isDark && styles.darkCardSubtitle]}>
            Add photos to your listing
          </Text>
          <View style={styles.photoTourPlaceholder}>
            {listing?.image_urls && listing.image_urls.length > 0 ? (
              <Image source={{ uri: listing.image_urls[0] }} style={styles.photoTourImage} />
            ) : (
              <Text style={styles.photoTourText}>No photos added yet</Text>
            )}
            <View style={styles.photoCountBadge}>
              <Text style={styles.photoCountText}>{listing?.image_urls?.length || 0} photos</Text>
            </View>
          </View>
        </Pressable>

        {/* Listing Source ID card */}
        <Pressable onPress={() => openEditModal('listingSourceId', { listing_source_id: formData.listing_source_id })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Listing Source ID</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.listing_source_id || <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Title card */}
        <Pressable onPress={() => openEditModal('title', { title: formData.title })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Title</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.title || <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Description card */}
        <Pressable onPress={() => openEditModal('description', { description: formData.description })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Description</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.description || <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Property type card */}
        <Pressable onPress={() => openEditModal('category', { category: formData.category })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Category</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.category || <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Lighting Type card */}
        <Pressable onPress={() => openEditModal('lightingType', { lighting_type: formData.lighting_type })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Lighting Type</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.lighting_type || <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Size card */}
        <Pressable onPress={() => openEditModal('size', { height: formData.height, width: formData.width, unit: formData.unit })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Size</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.height && formData.width && formData.unit
              ? `${formData.height} x ${formData.width} ${formData.unit}`
              : <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Quantity card */}
        <Pressable onPress={() => openEditModal('quantity', { quantity: formData.quantity })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Quantity</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.quantity || <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Pricing card */}
        <Pressable onPress={() => openEditModal('pricing', { price: formData.price })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Pricing</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.price ? `₹${formData.price}` : <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Availability card */}
        <Pressable onPress={() => openEditModal('availability', { availability_start: formData.availability_start, availability_end: formData.availability_end })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Availability</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.availability_start && formData.availability_end
              ? `${formData.availability_start} to ${formData.availability_end}`
              : <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
        </Pressable>

        {/* Location card */}
        <Pressable onPress={() => openEditModal('location', { address: formData.address, latitude: formData.latitude, longitude: formData.longitude })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Location</Text>
          {formData.latitude !== 0 && formData.longitude !== 0 ? (
            <StaticMapView
              latitude={formData.latitude}
              longitude={formData.longitude}
              height={screenWidth * 0.6} // Use the same height as the original MapView
              width={'100%'}
            />
          ) : (
            <View style={[styles.mapView, styles.mapPlaceholder]}>
              <Text style={[styles.placeholderText, isDark && styles.darkText]}>No location set</Text>
            </View>
          )}
          <View style={{ marginTop: 20 }}>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.google_location || formData.address || <Text style={styles.placeholderText}>Not set</Text>}
          </Text>
          </View>
        </Pressable>


        {/* Supporting Documents card */}
        <Pressable onPress={() => openEditModal('supportingDocuments', { supporting_documents: formData.supporting_documents })} style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[styles.cardTitle, isDark && styles.darkCardTitle]}>Supporting Documents</Text>
          <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
            {formData.supporting_documents.length > 0 ? formData.supporting_documents.map(doc => doc.split('/').pop()).join(', ') : <Text style={styles.placeholderText}>No documents added yet</Text>}
          </Text>
        </Pressable>

      </ScrollView>

      {/* Floating View Button */}
      <Pressable
        style={[styles.viewListingButton, { backgroundColor: tintColor }]}
        onPress={() => setIsViewListingModalVisible(true)}
      >
        <Ionicons
          name="eye-outline" // Using eye-outline for "View"
          size={20}
          color={isDark ? Colors.light.text : Colors.dark.text} // Dynamic color for icon
        />
        <Text style={[styles.viewListingButtonText, { color: isDark ? Colors.light.text : Colors.dark.text }]}>View</Text>
      </Pressable>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Pressable onPress={closeModal} style={styles.closeButton}>
              <FontAwesome name="times-circle" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
            </Pressable>
            <ScrollView>
              {selectedCardData?.cardType === 'photoTour' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Photos</Text>
                  {/* Add photo editing components here */}
                  <ImagePickerComponent
                    images={modalImages}
                    setImages={setModalImages}
                    loading={loading} // Use the main loading state or a dedicated one if needed
                    tintColor={tintColor}
                    isDark={isDark}
                  />
                  <Button mode="contained" onPress={() => handleModalSave({ image_urls: modalImages.map(img => img.uri) })} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'title' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Title</Text>
                  <TextInput
                    label="Title"
                    value={selectedCardData.data.title}
                    onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, title: text } })}
                    theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                    outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                    activeOutlineColor={tintColor}
                    textColor={isDark ? Colors.dark.text : Colors.light.text}
                    style={{ backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }}
                  />
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'description' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Description</Text>
                  <TextInput
                    label="Description"
                    value={selectedCardData.data.description}
                    onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, description: text } })}
                    multiline
                    numberOfLines={4}
                    theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                    outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                    activeOutlineColor={tintColor}
                    textColor={isDark ? Colors.dark.text : Colors.light.text}
                    style={{ backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }}
                  />
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'category' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Category</Text>
                  <TextInput
                    label="Category"
                    value={selectedCardData.data.category}
                    onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, category: text } })}
                    theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                    outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                    activeOutlineColor={tintColor}
                    textColor={isDark ? Colors.dark.text : Colors.light.text}
                    style={{ backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }}
                  />
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'pricing' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Pricing</Text>
                  <TextInput
                    label="Price per month (₹)"
                    value={selectedCardData.data.price}
                    onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, price: text } })}
                    keyboardType="numeric"
                    theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                    outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                    activeOutlineColor={tintColor}
                    textColor={isDark ? Colors.dark.text : Colors.light.text}
                    style={{ backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }}
                  />
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'availability' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Availability</Text>
                  <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={[styles.datePickerButton, isDark && styles.darkDatePickerButton]}>
                    <Text style={[styles.datePickerButtonText, isDark && styles.darkDatePickerButtonText]}>
                      {formData.availability_start ? `Start Date: ${formData.availability_start}` : 'Select Start Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={formData.availability_start ? new Date(formData.availability_start) : new Date()}
                      mode="date"
                      display="default"
                      onChange={onStartDateChange}
                    />
                  )}

                  <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={[styles.datePickerButton, isDark && styles.darkDatePickerButton]}>
                    <Text style={[styles.datePickerButtonText, isDark && styles.darkDatePickerButtonText]}>
                      {formData.availability_end ? `End Date: ${formData.availability_end}` : 'Select End Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={formData.availability_end ? new Date(formData.availability_end) : new Date()}
                      mode="date"
                      display="default"
                      onChange={onEndDateChange}
                    />
                  )}
                  <TouchableOpacity onPress={() => handleInputChange('is_unavailable', !formData.is_unavailable)} style={styles.markUnavailableButton}>
                    <Text style={[styles.markUnavailableText, { color: formData.is_unavailable ? Colors.light.error : Colors.light.tint }]}>
                      {formData.is_unavailable ? 'Mark Available' : 'Mark Unavailable'}
                    </Text>
                  </TouchableOpacity>
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'location' && (
                <View>
                  {/* This section will now only contain the map and the trigger for the new modal */}
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Location</Text>
                   <Text style={[styles.modalTitle, isDark && styles.darkText]}>Location</Text>
                  <Pressable onPress={() => setIsLocationPickerVisible(true)}>
                    <MapView
                      style={styles.mapView}
                      initialRegion={{
                        latitude: selectedCardData.data.latitude || 37.78825,
                        longitude: selectedCardData.data.longitude || -122.4324,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                    >
                      {selectedCardData.data.latitude !== 0 && selectedCardData.data.longitude !== 0 && (
                        <Marker
                          coordinate={{
                            latitude: selectedCardData.data.latitude,
                            longitude: selectedCardData.data.longitude,
                          }}
                          title="Listing Location"
                        />
                      )}
                    </MapView>
                  </Pressable>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Address</Text>
                  <Pressable onPress={() => setIsDetailedAddressModalVisible(true)}>
                    <Text style={[styles.cardContentText, isDark && styles.darkCardContentText]}>
                      {formData.address || <Text style={styles.placeholderText}>Not set</Text>}
                    </Text>
                  </Pressable>
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'imageUrls' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Image URLs</Text>
                  <ImagePickerComponent
                    images={modalImages}
                    setImages={setModalImages}
                    loading={loading} // Use the main loading state or a dedicated one if needed
                    tintColor={tintColor}
                    isDark={isDark}
                  />
                  <Button mode="contained" onPress={() => handleModalSave({ image_urls: modalImages.map(img => img.uri) })} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'listingSourceId' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Listing Source ID</Text>
                  <TextInput
                    label="Listing Source ID"
                    value={selectedCardData.data.listing_source_id}
                    onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, listing_source_id: text } })}
                    theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                    outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                    activeOutlineColor={tintColor}
                    textColor={isDark ? Colors.dark.text : Colors.light.text}
                    style={{ backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }}
                  />
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'lightingType' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Lighting Type</Text>
                  <TextInput
                    label="Lighting Type"
                    value={selectedCardData.data.lighting_type}
                    onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, lighting_type: text } })}
                    theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                    outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                    activeOutlineColor={tintColor}
                    textColor={isDark ? Colors.dark.text : Colors.light.text}
                    style={{ backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }}
                  />
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'size' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Size</Text>
                  <View style={styles.row}>
                    <TextInput
                      label="Height"
                      value={selectedCardData.data.height}
                      onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, height: text } })}
                      keyboardType="numeric"
                      theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                      outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                      activeOutlineColor={tintColor}
                      textColor={isDark ? Colors.dark.text : Colors.light.text}
                      style={[styles.input, styles.thirdInput, { marginRight: 10 }, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}
                    />
                    <TextInput
                      label="Width"
                      value={selectedCardData.data.width}
                      onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, width: text } })}
                      keyboardType="numeric"
                      theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                      outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                      activeOutlineColor={tintColor}
                      textColor={isDark ? Colors.dark.text : Colors.light.text}
                      style={[styles.input, styles.thirdInput, { marginRight: 10 }, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}
                    />
                    <Pressable
                      style={[styles.input, styles.thirdInput, styles.dropdownInput, { backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }]}
                      onPress={() => setUnitPickerVisible(true)}
                    >
                      <Text style={[styles.dropdownText, selectedCardData.data.unit ? (isDark ? styles.darkText : styles.lightText) : (isDark ? styles.darkPlaceholder : styles.lightPlaceholder)]}>
                        {selectedCardData.data.unit || 'Unit'}
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
                                setSelectedCardData((prev: any) => ({ ...prev, data: { ...prev.data, unit: u } }));
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
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'quantity' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Quantity</Text>
                  <TextInput
                    label="Quantity"
                    value={selectedCardData.data.quantity}
                    onChangeText={(text: string) => setSelectedCardData({ ...selectedCardData, data: { ...selectedCardData.data, quantity: text } })}
                    keyboardType="numeric"
                    theme={{ colors: { primary: tintColor, text: isDark ? Colors.dark.text : Colors.light.text, placeholder: isDark ? Colors.dark.textSecondary : Colors.light.textSecondary } }}
                    outlineColor={isDark ? Colors.dark.border : Colors.light.border}
                    activeOutlineColor={tintColor}
                    textColor={isDark ? Colors.dark.text : Colors.light.text}
                    style={{ backgroundColor: isDark ? Colors.dark.inputBackground : Colors.light.inputBackground }}
                  />
                  <Button mode="contained" onPress={() => handleModalSave(selectedCardData.data)} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
              {selectedCardData?.cardType === 'supportingDocuments' && (
                <View>
                  <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Supporting Documents</Text>
                  <DocumentPickerComponent
                    documents={modalSupportingDocuments}
                    setDocuments={setModalSupportingDocuments}
                    loading={loading}
                    tintColor={tintColor}
                    isDark={isDark}
                  />
                  <Button mode="contained" onPress={() => handleModalSave({ supporting_documents: modalSupportingDocuments })} loading={modalSaving} disabled={modalSaving} style={[styles.modalSaveButton, { backgroundColor: tintColor }]} labelStyle={[styles.modalSaveButtonLabel, isDark && styles.darkModalSaveButtonLabel]}>Save</Button>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isLocationPickerVisible}
        onRequestClose={() => setIsLocationPickerVisible(false)}
      >
        <LocationPickerMap
          initialLatitude={formData.latitude}
          initialLongitude={formData.longitude}
          initialGoogleLocation={formData.google_location}
          onLocationSelect={(latitude: number, longitude: number, google_location: string) => {
            setFormData((prev: typeof formData) => ({ ...prev, latitude, longitude, google_location }));
            setSelectedCardData((prev: any) => ({
              ...prev,
              data: {
                ...prev.data,
                latitude,
                longitude,
                google_location,
              },
            }));
            setIsLocationPickerVisible(false);
          }}
          onClose={() => setIsLocationPickerVisible(false)}
        />
      </Modal>

      {/* New Modal for DetailedAddressForm */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isDetailedAddressModalVisible}
        onRequestClose={() => setIsDetailedAddressModalVisible(false)}
      >
        <View style={{ height: '100%', flex: 1, backgroundColor: isDark ? Colors.dark.background : Colors.light.background }}>
          <Pressable onPress={() => setIsDetailedAddressModalVisible(false)} style={styles.closeButton}>
            <FontAwesome name="times-circle" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
          </Pressable>
          <DetailedAddressForm
            street={street}
            setStreet={setStreet}
            area={area}
            setArea={setArea}
            landmark={landmark}
            setLandmark={setLandmark}
            representativeName={representativeName}
            setRepresentativeName={setRepresentativeName}
            contactNo={contactNo}
            setContactNo={setContactNo}
            alternateContactNo={alternateContactNo}
            setAlternateContactNo={setAlternateContactNo}
            onConfirm={() => {
              setIsDetailedAddressModalVisible(false);
              handleModalSave({
                ...selectedCardData.data,
                street: street,
                area: area,
                landmark: landmark,
                representative_name: representativeName,
                contact_no: contactNo,
                alternate_contact_no: alternateContactNo,
              });
            }}
            onBack={() => setIsDetailedAddressModalVisible(false)}
            onClose={() => setIsDetailedAddressModalVisible(false)} // Pass onClose prop
            style={{ paddingTop: 50 }} // Add padding for the close button
            hideDisplayAddress={true} // Hide display address in edit listing
          />
        </View>
      </Modal>

      {/* Modal for viewing ListingDetailsScreen */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isViewListingModalVisible}
        onRequestClose={() => setIsViewListingModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? Colors.dark.background : Colors.light.background }}>
          <Pressable onPress={() => setIsViewListingModalVisible(false)} style={styles.closeButton}>
            <FontAwesome name="times-circle" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
          </Pressable>
          <ListingDetailsScreen id={listingId} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingBottom: 25, // Adjust this value based on your navigation bar height
  },
  darkContainer: {
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingTop: 50, // Adjust for status bar
  },
  darkHeader: {
    backgroundColor: Colors.dark.background,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
    marginLeft: 20, // Adjust to center title better
  },
  darkText: {
    color: Colors.dark.text,
  },
  settingsButton: {
    padding: 4,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingBottom: 30, // Increased padding at the bottom
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16, // Slightly larger border radius
    padding: 24, // Increased padding
    marginBottom: 20, // Increased margin bottom for better separation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // More pronounced shadow
    shadowOpacity: 0.15, // Increased shadow opacity
    shadowRadius: 8, // Increased shadow radius for softer look
    elevation: 6, // Increased elevation for Android
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  darkCard: {
    backgroundColor: Colors.dark.cardBackground,
    shadowColor: '#fff',
    shadowOpacity: 0.08, // Adjusted for dark mode
    borderColor: Colors.dark.border,
  },
  cardTitle: {
    fontSize: 22, // Slightly larger title
    fontWeight: '700', // Bolder title
    marginBottom: 12, // Increased margin bottom
    color: Colors.light.text,
  },
  darkCardTitle: {
    color: Colors.dark.text,
  },
  cardSubtitle: {
    fontSize: 15, // Slightly larger subtitle
    color: Colors.light.textSecondary,
    marginBottom: 8, // Increased margin bottom
  },
  darkCardSubtitle: {
    color: Colors.dark.textSecondary,
  },
  cardContentText: {
    fontSize: 17, // Slightly larger content text
    color: Colors.light.text,
    marginBottom: 12, // Increased margin bottom
  },
  darkCardContentText: {
    color: Colors.dark.text,
  },
  photoTourPlaceholder: {
    width: '100%',
    height: screenWidth * 0.5, // Aspect ratio for photos
    backgroundColor: Colors.light.inputBackground,
    borderRadius: 12, // Match card border radius
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16, // Increased margin bottom
    overflow: 'hidden', // Clip image to border radius
  },
  photoTourImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoTourText: {
    color: Colors.light.textSecondary,
    fontSize: 16,
  },
  photoCountBadge: {
    position: 'absolute',
    top: 15, // Adjusted position
    right: 15, // Adjusted position
    backgroundColor: 'rgba(0,0,0,0.7)', // Slightly darker background
    borderRadius: 20, // More rounded
    paddingHorizontal: 12, // Increased padding
    paddingVertical: 6, // Increased padding
  },
  photoCountText: {
    color: '#fff',
    fontSize: 13, // Slightly larger font
    fontWeight: 'bold',
  },
  taskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10, // Increased margin top
  },
  taskDot: {
    width: 9, // Slightly larger dot
    height: 9, // Slightly larger dot
    borderRadius: 4.5,
    backgroundColor: Colors.light.warning,
    marginRight: 10, // Increased right
  },
  taskText: {
    fontSize: 15, // Slightly larger text
    color: Colors.light.text,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
    paddingHorizontal: 18, // Increased padding
    paddingVertical: 30, // Increased padding
    borderRadius: 25, // More rounded
    alignSelf: 'flex-start',
    marginTop: 15, // Increased margin top
  },
  viewButtonText: {
    marginLeft: 8, // Increased margin left
    fontSize: 15, // Slightly larger font
    fontWeight: '600',
    color: Colors.light.text,
  },
  mapView: {
    width: '100%',
    height: screenWidth * 0.6, // Aspect ratio for map
    borderRadius: 12, // Match card border radius
    marginBottom: 16, // Increased margin bottom
  },
  mapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBackground,
  },
  // Removed mapText as it's no longer needed with actual map
  hostImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostImageText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  input: {
    marginBottom: 16, // Increased margin bottom
    backgroundColor: 'transparent',
    color: Colors.light.text,
  },
  darkInput: {
    color: '#fff',
  },
  saveButton: {
    marginTop: 30, // Increased margin top
    paddingVertical: 10, // Increased padding
    borderRadius: 10, // Slightly more rounded
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Increased padding
  },
  emptyText: {
    fontSize: 18, // Slightly larger font
    color: '#666',
    textAlign: 'center',
  },
  saveButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker overlay
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderTopLeftRadius: 24, // Larger border radius
    borderTopRightRadius: 24, // Larger border radius
    padding: 24, // Increased padding
    height: '100%', // Make the modal take up 100% of the screen height
    width: '100%',
  },
  darkModalContent: {
    backgroundColor: Colors.dark.cardBackground,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 12, // Increased padding
  },
  modalTitle: {
    fontSize: 24, // Larger title
    fontWeight: 'bold',
    marginBottom: 24, // Increased margin bottom
    textAlign: 'center',
  },
  modalSaveButton: {
    marginTop: 24, // Increased margin top
    paddingVertical: 10, // Increased padding
    borderRadius: 10, // Slightly more rounded
  },
  modalSaveButtonLabel: { // New style for modal save button label
    color: '#fff', // Default to white
    fontSize: 18,
    fontWeight: 'bold',
  },
  darkModalSaveButtonLabel: { // Dark mode style for modal save button label
    color: '#000', // Black text for white background in dark mode
  },
  placeholderText: {
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18, // Increased padding
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10, // Slightly more rounded
    marginBottom: 16,
    backgroundColor: Colors.light.inputBackground,
  },
  darkDatePickerButton: {
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.inputBackground,
  },
  datePickerButtonText: {
    fontSize: 17, // Slightly larger font
    color: Colors.light.text,
  },
  darkDatePickerButtonText: {
    color: Colors.dark.text,
  },
  markUnavailableButton: {
    marginTop: 15, // Increased margin top
    paddingVertical: 12, // Increased padding
    alignItems: 'center',
  },
  markUnavailableText: {
    fontSize: 17, // Slightly larger font
    fontWeight: 'bold',
  },
  viewListingButton: {
    position: 'absolute',
    bottom: 40, // Increased margin bottom
    alignSelf: 'center',
    flexDirection: 'row', // Added for icon and text alignment
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30, // Changed to 30 for more rounded look
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 100,
  },
  viewListingButtonText: {
    color: '#fff', // Keep white for tintColor background
    marginLeft: 8, // Added margin for icon
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  lightPlaceholder: {
    color: '#999',
  },
  darkPlaceholder: {
    color: '#666',
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
});
