import { StyleSheet, FlatList, ActivityIndicator, TextInput, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { ListingCard } from '@/components/ListingCard';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect, useCallback } from 'react';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

export default function MyListingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | 'pending' | 'approved' | 'rejected'>('All');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUserListings();
    }, [searchQuery, selectedStatusFilter])
  );

  const loadUserListings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const filters: { userId: string; search?: string; verificationStatus?: 'pending' | 'approved' | 'rejected' } = {
        userId: user.id,
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }
      if (selectedStatusFilter !== 'All') {
        filters.verificationStatus = selectedStatusFilter;
      }

      const userListings = await listingsService.getUserListings(filters);
      setListings(userListings);
    } catch (error) {
      console.error('Error loading user listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleStatusFilterChange = useCallback((value: 'All' | 'pending' | 'approved' | 'rejected') => {
    setSelectedStatusFilter(value);
  }, []);

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
        </Pressable>
        <Text style={[styles.title, isDark && styles.darkText]}>Your listings</Text>
        <View style={styles.headerRightIcons}>
          <Pressable style={styles.headerIcon} onPress={() => setShowSearchBar(!showSearchBar)}>
            <Ionicons name="search-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </Pressable>
          <Pressable style={styles.headerIcon} onPress={() => setShowFilterPicker(!showFilterPicker)}>
            <Ionicons name="options-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </Pressable>
          <Pressable style={styles.headerIcon} onPress={() => router.push('/add-listing')}>
            <Ionicons name="add-circle-outline" size={24} color={isDark ? '#fff' : '#000'} />
          </Pressable>
        </View>
      </View>

      {(showSearchBar || showFilterPicker) && (
        <View style={[styles.searchFilterContainer, isDark && styles.darkSearchFilterContainer]}>
          {showSearchBar && (
            <TextInput
              style={[styles.searchInput, isDark && styles.darkSearchInput]}
              placeholder="Search your listings..."
              placeholderTextColor={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
          )}
          {showFilterPicker && (
            <View style={[styles.pickerContainer, isDark && styles.darkPickerContainer]}>
              <Picker
                selectedValue={selectedStatusFilter}
                onValueChange={handleStatusFilterChange}
                style={[styles.statusPicker, isDark && styles.darkStatusPicker]}
                dropdownIconColor={isDark ? Colors.dark.text : Colors.light.text}
              >
                <Picker.Item label="All Statuses" value="All" />
                <Picker.Item label="Pending" value="pending" />
                <Picker.Item label="Approved" value="approved" />
                <Picker.Item label="Rejected" value="rejected" />
              </Picker>
            </View>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && styles.darkText]}>
            You haven't created any listings yet or no matching listings found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={({ item }) => (
            <ListingCard 
              item={item}
              tintColor={tintColor}
              onPress={(listingId) => router.push(`/listing/edit/${listingId}`)}
              showVerificationStatus={true}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 25, // Adjust this value based on your navigation bar height
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute items
    paddingHorizontal: 16,
    paddingVertical: 15, // Adjust padding
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: 50, // Adjust for status bar and overall top spacing
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  backButton: {
    // No absolute positioning needed if using space-between
    padding: 4,
  },
  title: {
    fontSize: 22, // Slightly smaller for better fit
    fontWeight: 'bold',
    color: '#000',
    flex: 1, // Allow title to take up space
    textAlign: 'center', // Center the title
    marginLeft: 20, // Adjust margin to center title better with back button
  },
  darkText: {
    color: '#fff',
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 15, // Spacing between icons
  },
  searchFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkSearchFilterContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  searchInput: {
    height: 40,
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: Colors.light.text,
    backgroundColor: Colors.light.inputBackground,
  },
  darkSearchInput: {
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.inputBackground,
  },
  pickerContainer: {
    borderColor: Colors.light.border,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden', // Ensures the picker's background color is contained
    backgroundColor: Colors.light.inputBackground,
  },
  darkPickerContainer: {
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.inputBackground,
  },
  statusPicker: {
    height: 40,
    color: Colors.light.text,
  },
  darkStatusPicker: {
    color: Colors.dark.text,
  },
  listContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16, // Keep horizontal padding
    gap: 24, // Add gap between items
    alignItems: 'center', // Center items in the list
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
