import { StyleSheet, FlatList, TextInput, View as RNView, ScrollView, Pressable, ActivityIndicator } from 'react-native';
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
import { router } from 'expo-router'; // Import router


function SearchBar({ onSearch, isDark }: { onSearch: (text: string) => void, isDark: boolean }) {
  return (
    <RNView style={[styles.searchContainer, isDark && styles.darkSearchContainer]}>
      <FontAwesome name="search" size={16} color={isDark ? '#999' : '#666'} style={styles.searchIcon} />
      <TextInput
        style={[styles.searchInput, isDark && styles.darkSearchInput]}
        placeholder="Search listings..."
        placeholderTextColor={isDark ? '#666' : '#999'}
        onChangeText={onSearch}
      />
    </RNView>
  );
} 

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

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme].tint;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const filters = selectedCategory !== 'All' ? { category: selectedCategory } : undefined;
      const data = await listingsService.getListings(filters);
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [selectedCategory]);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleFilter = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, isDark && styles.darkTitle]}>Find your space</Text>
          <CartButton />
        </View>
        <SearchBar onSearch={handleSearch} isDark={isDark} />
        <FilterChips onFilter={handleFilter} isDark={isDark} selectedCategory={selectedCategory} />
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : filteredListings.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="sad-outline" size={48} color={isDark ? '#666' : '#999'} style={{ marginBottom: 16 }} />
          <Text style={[{ fontSize: 20, fontWeight: '600', color: isDark ? '#666' : '#999', marginBottom: 8, textAlign: 'center' }]}>
            No spaces found
          </Text>
          <Text style={[{ fontSize: 16, color: isDark ? '#666' : '#999', textAlign: 'center' }]}>
            {searchQuery ? 'Try adjusting your search' : selectedCategory !== 'All' ? 'Try a different category' : 'Check back later for new listings'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredListings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ListingCard item={item} tintColor={tintColor} />
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
          name="map-outline" // Using map-marker for a solid map icon
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
  titleRow: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  darkSearchContainer: {
    backgroundColor: '#1a1a1a',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    padding: 0,
  },
  darkSearchInput: {
    color: '#fff',
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
