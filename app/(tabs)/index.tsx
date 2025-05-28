import { StyleSheet, FlatList, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ListingCard } from '@/components/ListingCard';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import { CartButton } from '@/components/CartButton';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';

function FilterChips({ onFilter, isDark, selectedCategory }: { onFilter: (category: string) => void, isDark: boolean, selectedCategory: string }) {
  const categories = ['All', 'Billboard', 'LED Display', 'Banner'];
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {categories.map((category) => {
        const isSelected = category === selectedCategory;
        return (
          <Pressable
            key={category}
            style={[
              styles.filterChip,
              isDark && styles.darkFilterChip,
              { 
                backgroundColor: isSelected 
                  ? Colors[isDark ? 'dark' : 'light'].tint 
                  : isDark 
                    ? '#1a1a1a' 
                    : '#f0f0f0' 
              }
            ]}
            onPress={() => onFilter(category)}
          >
            <Text 
              style={[
                styles.filterChipText, 
                isDark && styles.darkFilterChipText,
                isSelected && { color: '#fff' }
              ]}
            >
              {category}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

interface CityPickerProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  isDark: boolean;
}

const CityPicker: React.FC<CityPickerProps> = ({ selectedCity, onCityChange, isDark }) => {
  const cities = ['Ahmedabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Hyderabad', 'Jaipur']; // Example cities

  return (
    <View style={[styles.cityPickerContainer, isDark && styles.darkCityPickerContainer]}>
      <Ionicons name="location-outline" size={18} color={isDark ? '#fff' : '#000'} style={styles.cityPickerIcon} />
      <Text style={[styles.cityPickerText, isDark && styles.darkCityPickerText]}>
        {selectedCity || 'Select your city'}
      </Text>
      <Ionicons name="chevron-down" size={18} color={isDark ? '#fff' : '#000'} style={styles.cityPickerIcon} />
      <Picker
        selectedValue={selectedCity}
        onValueChange={(itemValue: string) => onCityChange(itemValue)}
        style={[styles.cityPicker, isDark && styles.darkCityPicker]}
      >
        <Picker.Item label="Select City" value="" />
        {cities.map((c) => (
          <Picker.Item key={c} label={c} value={c} />
        ))}
      </Picker>
    </View>
  );
};


export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme].tint;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        setSelectedCity('Ahmedabad'); // Default city if permission denied
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync(location.coords);
      if (geocode && geocode.length > 0 && geocode[0].city) {
        setSelectedCity(geocode[0].city);
      } else {
        setSelectedCity('Ahmedabad'); // Default city if geocoding fails
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadListings();
    }, [selectedCategory, selectedCity])
  );

  const loadListings = async () => {
    try {
      setLoading(true);
      const filters: { category?: string; city?: string } = {};

      if (selectedCategory !== 'All') {
        filters.category = selectedCategory;
      }
      if (selectedCity) {
        filters.city = selectedCity;
      }

      const data = await listingsService.getListings(filters);
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <View style={styles.headerTopRow}>
          <CityPicker selectedCity={selectedCity} onCityChange={setSelectedCity} isDark={isDark} />
          <CartButton />
        </View>
        <Text style={[styles.title, isDark && styles.darkTitle, { paddingHorizontal: 16, marginBottom: 8 }]}>Find your space</Text>
        <FilterChips onFilter={handleFilter} isDark={isDark} selectedCategory={selectedCategory} />
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="sad-outline" size={48} color={isDark ? '#666' : '#999'} style={{ marginBottom: 16 }} />
          <Text style={[{ fontSize: 20, fontWeight: '600', color: isDark ? '#666' : '#999', marginBottom: 8, textAlign: 'center' }]}>
            No spaces found
          </Text>
          <Text style={[{ fontSize: 16, color: isDark ? '#666' : '#999', textAlign: 'center' }]}>
            {selectedCity ? `No listings found in ${selectedCity} for the selected category.` : 'Check back later for new listings or try a different city/category.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard item={item} tintColor={tintColor} showVerificationStatus={false} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      <Pressable
        onPress={() => router.push('/map')}
        style={({ pressed }) => [
          styles.floatingMapButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Ionicons
          name="map-outline"
          size={20}
          color="#000"
        />
        <Text style={styles.floatingMapButtonText}>Map</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerTopRow: { // New style for the top row in header
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 40,
  },
  cityPickerContainer: { // Container for the city picker dropdown
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25, // More rounded for BookMyShow style
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 150, // Ensure enough width
    justifyContent: 'center',
    position: 'relative', // For absolute positioning of the actual picker
  },
  darkCityPickerContainer: {
    backgroundColor: '#1a1a1a',
  },
  cityPickerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 5,
    marginLeft: 5,
  },
  darkCityPickerText: {
    color: '#fff',
  },
  cityPickerIcon: {
    marginLeft: 'auto', // Push icon to the right
  },
  cityPicker: { // The actual Picker component, made transparent and overlaid
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    color: 'transparent', // Make text transparent
    opacity: 0, // Make the picker itself invisible
  },
  darkCityPicker: {
    color: 'transparent', // Make text transparent
  },
  titleRow: { // Renamed from titleRow to headerTitleRow if needed, but keeping for now
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 16,
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkHeader: {
    backgroundColor: '#000',
    borderBottomColor: '#1a1a1a',
  },
  filterContainer: {
    maxHeight: 40,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  darkFilterChip: {
    backgroundColor: '#1a1a1a',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  darkFilterChipText: {
    color: '#999',
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingHorizontal: 16,
    color: '#000',
  },
  darkTitle: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  floatingMapButton: {
    position: 'absolute',
    backgroundColor: '#fff',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  floatingMapButtonText: {
    color: '#000',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
