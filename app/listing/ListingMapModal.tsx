import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';

interface ListingMapModalProps {
  visible: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  title: string;
  address: string;
}

const { width, height } = Dimensions.get('window');

export default function ListingMapModal({
  visible,
  onClose,
  latitude,
  longitude,
  title,
  address,
}: ListingMapModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleOpenInMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps');
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={[styles.header, isDark && styles.darkHeader]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isDark && styles.darkHeaderText]}>{title}</Text>
          <TouchableOpacity onPress={handleOpenInMaps} style={styles.openMapsButton}>
            <Ionicons name="map-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.002, // Increased zoom
            longitudeDelta: 0.002, // Increased zoom
          }}
          showsUserLocation={true}
          scrollEnabled={true} // Ensure full screen map is scrollable
          zoomEnabled={true} // Ensure full screen map is zoomable
        >
          <Marker
            coordinate={{ latitude: latitude, longitude: longitude }}
            title={title}
            description={address}
          />
        </MapView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  closeButton: {
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
    marginRight: 0, // Adjusted as button is added
  },
  openMapsButton: {
    paddingLeft: 16,
  },
  darkHeaderText: {
    color: '#fff',
  },
  map: {
    flex: 1,
    width: width,
    height: height,
  },
});
