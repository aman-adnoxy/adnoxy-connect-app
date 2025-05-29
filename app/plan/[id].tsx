import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Platform, TextInput, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { planService } from '@/services/plan';
import { listingsService } from '@/services/listings';
import { Plan } from '@/types/plan';
import { Listing } from '@/types/listing';
import MapView, { Marker } from 'react-native-maps';
import { useColorScheme } from '@/hooks/useColorScheme';
import PlanListings from '@/components/PlanListings';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

export default function PlanDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation(); // Call useNavigation hook
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [plan, setPlan] = useState<Plan | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [rentalCharges, setRentalCharges] = useState<number>(0);
  const [printingCharges, setPrintingCharges] = useState<number>(0);
  const [installationCharges, setInstallationCharges] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [gst, setGst] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [showEditModal, setShowEditModal] = useState(false); // New state for modal visibility
  const [editedPlanName, setEditedPlanName] = useState('');
  const [editedStartDate, setEditedStartDate] = useState<Date>(new Date());
  const [editedEndDate, setEditedEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  useEffect(() => {
    if (user && id) {
      loadPlan();
    }
  }, [user, id]);

  useEffect(() => {
    if (plan) {
      setEditedPlanName(plan.name);
      setEditedStartDate(new Date(plan.start_date));
      setEditedEndDate(new Date(plan.end_date));
      setStartDate(new Date(plan.start_date)); // Initialize main state from plan
      setEndDate(new Date(plan.end_date));     // Initialize main state from plan
    }
  }, [plan]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide default header
    });
  }, [navigation]);

  useEffect(() => {
    if (listings.length > 0) {
      const calculatedRentalCharges = listings.reduce((sum, listing) => sum + listing.price, 0);
      setRentalCharges(calculatedRentalCharges);

      // For now, printing and installation charges are hardcoded to 0 as per example
      // In a real application, these would likely come from listing data or user input
      const calculatedPrintingCharges = 0; 
      const calculatedInstallationCharges = 0;

      const calculatedTotal = calculatedRentalCharges + calculatedPrintingCharges + calculatedInstallationCharges;
      const calculatedGst = calculatedTotal * 0.18; // 18% GST
      const calculatedGrandTotal = calculatedTotal + calculatedGst;

      setPrintingCharges(calculatedPrintingCharges);
      setInstallationCharges(calculatedInstallationCharges);
      setTotal(calculatedTotal);
      setGst(calculatedGst);
      setGrandTotal(calculatedGrandTotal);
    } else {
      setRentalCharges(0);
      setPrintingCharges(0);
      setInstallationCharges(0);
      setTotal(0);
      setGst(0);
      setGrandTotal(0);
    }
  }, [listings]);

  const loadPlan = async () => {
    try {
      const planData = await planService.getPlan(user!.id, id as string);
      setPlan(planData);
      
      // Load listing details
      const listingDetails = await Promise.all(
        planData.listings.map(listingId => listingsService.getListingById(listingId))
      );
      setListings(listingDetails);
    } catch (error) {
      console.error('Error loading plan:', error);
      Alert.alert('Error', 'Failed to load plan details');
    }
  };

  const handleRemoveListing = (listingId: string) => {
    Alert.alert(
      'Remove Listing',
      'Are you sure you want to remove this listing from your plan?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              await planService.removeFromPlan(user!.id, id as string, listingId);
              await loadPlan();
            } catch (error) {
              console.error('Error removing listing:', error);
              Alert.alert('Error', 'Failed to remove listing from plan');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (dateType === 'start') {
        setEditedStartDate(selectedDate); // Update edited date
        if (selectedDate > editedEndDate) {
          setEditedEndDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
        }
      } else {
        setEditedEndDate(selectedDate); // Update edited date
      }
    }
  };

  const updatePlanDates = async () => {
    try {
      await planService.updatePlanDates(
        user!.id,
        id as string,
        startDate.toISOString(),
        endDate.toISOString()
      );
      await loadPlan();
    } catch (error) {
      console.error('Error updating dates:', error);
      Alert.alert('Error', 'Failed to update plan dates');
    }
  };

  const handleExport = async () => {
    if (!listings.length) {
      Alert.alert('No Listings', 'There are no listings to export.');
      return;
    }

    const data = listings.map(listing => ({
      'Listing ID': listing.id,
      'Title': listing.title,
      'Description': listing.description,
      'Price': listing.price,
      'Category': listing.category,
      'Address': listing.address,
      'City': listing.city,
      'Latitude': listing.latitude,
      'Longitude': listing.longitude,
      'Availability Start': listing.availability_start ? new Date(listing.availability_start).toLocaleDateString() : 'N/A',
      'Availability End': listing.availability_end ? new Date(listing.availability_end).toLocaleDateString() : 'N/A',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plan Listings');

    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    if (Platform.OS === 'web') {
      const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plan_listings.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (Platform.OS === 'android') {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const directoryUri = permissions.directoryUri;
          const fileName = 'plan_listings.xlsx';
          const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(directoryUri, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
          Alert.alert('Success', `File saved to: ${fileUri}`);
        } else {
          Alert.alert('Permission Denied', 'Storage permission is required to download the file.');
        }
      } catch (error) {
        console.error('Error exporting data to Android storage:', error);
        Alert.alert('Export Error', 'Failed to export data to Android storage. Please try again.');
      }
    } else { // iOS and other platforms
      const uri = FileSystem.cacheDirectory + 'plan_listings.xlsx';
      try {
        await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });
        await Sharing.shareAsync(uri, { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } catch (error) {
        console.error('Error exporting data:', error);
        Alert.alert('Export Error', 'Failed to export data. Please try again.');
      }
    }
  };

  // Helper function to convert s2ab (string to arraybuffer) for XLSX
  const s2ab = (s: string) => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  const renderMap = () => {
    if (!listings.length) return null;

    const initialRegion = {
      latitude: listings[0].latitude,
      longitude: listings[0].longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    return (
      <View style={[styles.mapContainer, isMapExpanded && styles.mapExpanded]}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {listings.map((listing) => (
            <Marker
              key={listing.id}
              coordinate={{
                latitude: listing.latitude,
                longitude: listing.longitude,
              }}
              title={listing.title}
              description={listing.description}
            />
          ))}
        </MapView>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsMapExpanded(!isMapExpanded)}
        >
          <Ionicons
            name={isMapExpanded ? 'contract' : 'expand'}
            size={24}
            color={colorScheme === 'dark' ? '#fff' : '#000'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const handleSaveEdit = async () => {
    if (!editedPlanName.trim()) {
      Alert.alert('Error', 'Plan name cannot be empty.');
      return;
    }
    if (editedStartDate > editedEndDate) {
      Alert.alert('Error', 'Start date cannot be after end date.');
      return;
    }

    try {
      await planService.updatePlan(
        user!.id,
        id as string,
        editedPlanName.trim(),
        editedStartDate.toISOString(),
        editedEndDate.toISOString()
      );
      await loadPlan(); // Reload plan data to reflect changes
      setShowEditModal(false); // Close modal on success
      Alert.alert('Success', 'Plan updated successfully.');
    } catch (error) {
      console.error('Error updating plan:', error);
      Alert.alert('Error', 'Failed to update plan. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    // Reset edited states to current plan values if user cancels
    if (plan) {
      setEditedPlanName(plan.name);
      setEditedStartDate(new Date(plan.start_date));
      setEditedEndDate(new Date(plan.end_date));
    }
    setShowEditModal(false);
  };

  if (!plan) {
    return (
      <View style={[styles.container, colorScheme === 'dark' && styles.darkContainer]}>
        <Text style={[styles.loadingText, colorScheme === 'dark' && styles.darkText]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      {/* Custom Header */}
      <View style={[styles.customHeader, isDark && styles.darkCustomHeader]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.customHeaderTitle, isDark && styles.darkText]}>{plan.name}</Text>
          <TouchableOpacity onPress={() => setShowEditModal(true)}>
            <Text style={[styles.customHeaderEditButton, isDark && styles.darkText]}>Edit</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.dateRangeContainer, isDark && styles.darkDateRangeContainer]}>
          <Text style={[styles.dateRangeText, isDark && styles.darkDateRangeText]}>
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollViewContent}>

      <View style={[styles.summaryContainer, colorScheme === 'dark' && styles.darkSummaryContainer]}>
        <Text style={[styles.summaryHeading, colorScheme === 'dark' && styles.darkText]}>Plan Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, colorScheme === 'dark' && styles.darkText]}>Rental Charges :</Text>
          <Text style={[styles.summaryValue, colorScheme === 'dark' && styles.darkText]}>₹{rentalCharges.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, colorScheme === 'dark' && styles.darkText]}>Printing Charges:</Text>
          <Text style={[styles.summaryValue, colorScheme === 'dark' && styles.darkText]}>₹{printingCharges.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, colorScheme === 'dark' && styles.darkText]}>Installation Charges:</Text>
          <Text style={[styles.summaryValue, colorScheme === 'dark' && styles.darkText]}>₹{installationCharges.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, styles.summaryTotalLabel, colorScheme === 'dark' && styles.darkText]}>Total:</Text>
          <Text style={[styles.summaryValue, styles.summaryTotalValue, colorScheme === 'dark' && styles.darkText]}>₹{total.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, colorScheme === 'dark' && styles.darkText]}>GST @18%:</Text>
          <Text style={[styles.summaryValue, colorScheme === 'dark' && styles.darkText]}>₹{gst.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, styles.summaryGrandTotalLabel, colorScheme === 'dark' && styles.darkText]}>Grand Total:</Text>
          <Text style={[styles.summaryValue, styles.summaryGrandTotalValue, colorScheme === 'dark' && styles.darkText]}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.exportButton, colorScheme === 'dark' && styles.darkExportButton]}
          onPress={handleExport}
        >
          <Ionicons name="download" size={20} color={colorScheme === 'dark' ? '#000' : '#fff'} />
          <Text style={styles.exportButtonText}>Export to XLSX</Text>
        </TouchableOpacity>
      </View>

      {renderMap()}

      <PlanListings
        listings={listings}
        onRemoveListing={handleRemoveListing}
        startDate={startDate.toISOString()}
        endDate={endDate.toISOString()}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={showEditModal}
        onRequestClose={handleCancelEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Edit Plan</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Plan Name"
              placeholderTextColor={isDark ? '#aaa' : '#888'}
              value={editedPlanName}
              onChangeText={setEditedPlanName}
            />
            <TouchableOpacity
              style={[styles.dateEditButton, isDark && styles.darkDateEditButton]}
              onPress={() => {
                setDateType('start');
                setShowDatePicker(true);
              }}
            >
              <Text style={[styles.dateLabel, isDark && styles.darkText]}>Start Date</Text>
              <Text style={[styles.dateValue, isDark && styles.darkText]}>
                {editedStartDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dateEditButton, isDark && styles.darkDateEditButton]}
              onPress={() => {
                setDateType('end');
                setShowDatePicker(true);
              }}
            >
              <Text style={[styles.dateLabel, isDark && styles.darkText]}>End Date</Text>
              <Text style={[styles.dateValue, isDark && styles.darkText]}>
                {editedEndDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelEditButton} onPress={handleCancelEdit}>
              <Text style={[styles.cancelText, isDark && styles.darkText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDatePicker && ( // DatePicker is now always shown if showDatePicker is true, but only triggered from modal
        <DateTimePicker
          value={dateType === 'start' ? editedStartDate : editedEndDate} // Use edited dates for picker
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              if (dateType === 'start') {
                setEditedStartDate(selectedDate);
                if (selectedDate > editedEndDate) {
                  setEditedEndDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
                }
              } else {
                setEditedEndDate(selectedDate);
              }
            }
          }}
          minimumDate={dateType === 'end' ? editedStartDate : undefined}
        />
      )}
      </ScrollView>
    </View>
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
  scrollViewContent: {
    flex: 1,
    marginBottom: 20, // Added bottom padding for navigation bar
  },
  // Header styles are now managed by router.setOptions
  // header: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   padding: 16,
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#e0e0e0',
  // },
  backButton: {
    padding: 5, // Add some padding for easier touch
  },
  headerRightText: {
    fontSize: 16,
    color: '#007bff', // A common blue for actionable text
    fontWeight: 'bold',
  },
  darkText: {
    color: '#fff',
  },
  mapContainer: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapExpanded: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    zIndex: 1000,
  },
  map: {
    flex: 1,
  },
  expandButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  customHeader: {
    flexDirection: 'column', // Changed to column
    alignItems: 'center', // Center children horizontally
    paddingHorizontal: 16,
    marginTop: 75, // Adjust as needed for status bar clearance
    backgroundColor: '#fff', // Default background
    zIndex: 10, // Ensure header is above other content
    paddingBottom: 10, // Add some padding to the bottom of the header
  },
  darkCustomHeader: {
    backgroundColor: '#1a1a1a', // Dark mode background
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute items
    width: '100%', // Take full width of parent
  },
  headerTitleContainer: {
    // flex: 1, // Removed flex as parent container now handles spacing
    // alignItems: 'center', // Removed as parent container now handles centering
  },
  customHeaderTitle: {
    fontSize: 20, // Adjusted font size
    fontWeight: '800',
    color: '#000',
    // flex: 1, // Removed flex as parent container now handles spacing
    // textAlign: 'center', // Removed as parent container now handles centering
    // marginLeft: -24, // Counteract back button padding/margin - removed as it might interfere with new layout
  },
  customHeaderEditButton: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: 'bold',
  },
  dateRangeContainer: {
    backgroundColor: '#404040', // Darker grey background for the pill shape
    borderRadius: 20, // Rounded corners for pill shape
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 5, // Space between title and date range
    // marginLeft: 10, // Removed as parent container now handles centering
    // marginRight: 10,
    // alignSelf: 'center', // Removed as parent container now handles centering
  },
  darkDateRangeContainer: {
    backgroundColor: '#333', // Darker background for dark mode
  },
  dateRangeText: {
    fontSize: 13, // Adjusted font size
    fontWeight: '600',
    color: '#000', // Default color for light mode
  },
  darkDateRangeText: {
    color: '#fff', // White color for dark mode
  },
  planInfoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 0, // Adjusted space for custom header
  },
  darkPlanInfoContainer: {
    borderBottomColor: '#404040',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Changed to space-evenly for better distribution
    marginBottom: 5,
  },
  dateLabelHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center', // Keep text centered within its flex item
    flex: 1, // Allow items to take equal space
  },
  dateArrow: {
    flex: 0.2, // Make arrow smaller
  },
  dateValueDisplay: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center', // Keep text centered within its flex item
    flex: 1, // Allow items to take equal space
  },
  dateSpacer: {
    flex: 0.2, // Match arrow flex for alignment
  },
  dateEditButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  darkDateEditButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#404040',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  summaryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  darkSummaryContainer: {
    borderBottomColor: '#404040',
  },
  summaryHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  summaryTotalLabel: {
    fontWeight: 'bold',
    color: '#000',
  },
  summaryTotalValue: {
    fontWeight: 'bold',
    color: '#000',
  },
  summaryGrandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryGrandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745', // Green color for grand total
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  darkExportButton: {
    backgroundColor: '#6a0dad', // Darker purple for dark mode
  },
  exportButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  editFormContainer: {
    padding: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  darkInput: {
    backgroundColor: '#333',
    color: '#fff',
    borderColor: '#444',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelEditButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  darkModalContent: {
    backgroundColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
});
