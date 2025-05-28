import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function PlanDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  useEffect(() => {
    if (user && id) {
      loadPlan();
    }
  }, [user, id]);

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

  const handleRemoveListing = async (listingId: string) => {
    try {
      await planService.removeFromPlan(user!.id, id as string, listingId);
      await loadPlan();
    } catch (error) {
      console.error('Error removing listing:', error);
      Alert.alert('Error', 'Failed to remove listing from plan');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (dateType === 'start') {
        setStartDate(selectedDate);
        if (selectedDate > endDate) {
          setEndDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
        }
      } else {
        setEndDate(selectedDate);
      }
      updatePlanDates();
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

  if (!plan) {
    return (
      <View style={[styles.container, colorScheme === 'dark' && styles.darkContainer]}>
        <Text style={[styles.loadingText, colorScheme === 'dark' && styles.darkText]}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, colorScheme === 'dark' && styles.darkContainer]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={colorScheme === 'dark' ? '#fff' : '#000'}
          />
        </TouchableOpacity>
        <Text style={[styles.title, colorScheme === 'dark' && styles.darkText]}>
          {plan.name}
        </Text>
      </View>

      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={[styles.dateButton, colorScheme === 'dark' && styles.darkDateButton]}
          onPress={() => {
            setDateType('start');
            setShowDatePicker(true);
          }}
        >
          <Text style={[styles.dateLabel, colorScheme === 'dark' && styles.darkText]}>Start Date</Text>
          <Text style={[styles.dateValue, colorScheme === 'dark' && styles.darkText]}>
            {startDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateButton, colorScheme === 'dark' && styles.darkDateButton]}
          onPress={() => {
            setDateType('end');
            setShowDatePicker(true);
          }}
        >
          <Text style={[styles.dateLabel, colorScheme === 'dark' && styles.darkText]}>End Date</Text>
          <Text style={[styles.dateValue, colorScheme === 'dark' && styles.darkText]}>
            {endDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      {renderMap()}

      <PlanListings
        listings={listings}
        onRemoveListing={handleRemoveListing}
        startDate={startDate.toISOString()}
        endDate={endDate.toISOString()}
      />

      {showDatePicker && (
        <DateTimePicker
          value={dateType === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={dateType === 'end' ? startDate : undefined}
        />
      )}
    </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  dateButton: {
    flex: 1,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  darkDateButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#404040',
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
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
}); 