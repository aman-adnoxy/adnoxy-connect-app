import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, ViewStyle } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface DetailedAddressFormProps {
  street: string;
  setStreet: (text: string) => void;
  area: string;
  setArea: (text: string) => void;
  landmark: string; // New landmark prop
  setLandmark: (text: string) => void; // New setLandmark prop
  representativeName: string;
  setRepresentativeName: (text: string) => void;
  contactNo: string;
  setContactNo: (text: string) => void;
  alternateContactNo: string;
  setAlternateContactNo: (text: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  onClose?: () => void; // New optional prop to close the modal
  style?: ViewStyle; // New optional prop for styling the container
  displayAddress?: string; // To display the previously selected address (now optional)
  hideDisplayAddress?: boolean; // New optional prop to hide the display address section
}

export default function DetailedAddressForm({
  street,
  setStreet,
  area,
  setArea,
  landmark, // Destructure new prop
  setLandmark, // Destructure new prop
  representativeName,
  setRepresentativeName,
  contactNo,
  setContactNo,
  alternateContactNo,
  setAlternateContactNo,
  onConfirm,
  onBack,
  onClose, // Destructure new prop
  style, // Destructure new prop
  displayAddress,
  hideDisplayAddress = false, // Default to false
}: DetailedAddressFormProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  const handleConfirm = () => {
    // Assuming landmark is optional based on types/listing.ts
    if (!street || !area || !representativeName || !contactNo) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    onConfirm();
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer, style]}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        {onClose ? (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? Colors.dark.text : Colors.light.text} />
          </TouchableOpacity>
        )}
        <Text style={[Typography.h2, styles.headerTitle, isDark && styles.darkHeaderTitle]}>
          Detailed Address
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {!hideDisplayAddress && ( // Conditionally render based on hideDisplayAddress prop
          <View style={[styles.addressHeaderContainer, isDark && styles.darkAddressHeaderContainer]}>
            <Text style={[Typography.h3, styles.displayAddressHeading, isDark && styles.darkDisplayAddressHeading]}>
              {displayAddress}
            </Text>
            <TouchableOpacity
              style={[styles.changeLocationButton, { backgroundColor: tintColor }]}
              onPress={onBack}
            >
              <Text style={styles.changeLocationButtonText}>Change Location</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.formContainer, isDark && styles.darkFormContainer]}>
          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Street/Road <Text style={styles.requiredIndicator}>*</Text></Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={street}
              onChangeText={setStreet}
              placeholder="Enter street or road"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Area/Region <Text style={styles.requiredIndicator}>*</Text></Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={area}
              onChangeText={setArea}
              placeholder="Enter area or region"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          {/* New Landmark field */}
          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Landmark (Optional)</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Enter a nearby landmark"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Representative Name <Text style={styles.requiredIndicator}>*</Text></Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={representativeName}
              onChangeText={setRepresentativeName}
              placeholder="Enter representative name"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Contact No. <Text style={styles.requiredIndicator}>*</Text></Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={contactNo}
              onChangeText={setContactNo}
              placeholder="Enter contact number"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Alternate Contact No.</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={alternateContactNo}
              onChangeText={setAlternateContactNo}
              placeholder="Enter alternate contact number (optional)"
              placeholderTextColor={isDark ? '#666' : '#999'}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: tintColor }]}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>Confirm Details & Continue</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.light.background,
    paddingTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  darkHeader: {
    backgroundColor: Colors.dark.background,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: { // New style for close button
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left', // Align left
    color: Colors.light.text,
    marginLeft: 10, // Adjust as needed
    fontSize: 22, // Make it more prominent
    fontWeight: 'bold',
  },
  darkHeaderTitle: {
    color: Colors.dark.text,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  addressHeaderContainer: {
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkAddressHeaderContainer: {
    backgroundColor: Colors.dark.background,
  },
  displayAddressHeading: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  darkDisplayAddressHeading: {
    color: '#fff',
  },
  changeLocationButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.tint, // Use tint color
  },
  changeLocationButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkFormContainer: {
    backgroundColor: Colors.dark.background,
  },
  inputGroup: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  label: {
    marginBottom: 8,
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '500',
  },
  darkLabel: {
    color: Colors.dark.text,
  },
  requiredIndicator: {
    color: 'red',
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.inputBackground, // New input background color
  },
  darkInput: {
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.inputBackground, // New input background color
  },
  confirmButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
