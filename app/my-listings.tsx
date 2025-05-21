import { StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { ListingCard } from '@/components/ListingCard';
import Colors from '@/constants/Colors';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState, useEffect } from 'react';
import { listingsService } from '@/services/listings';
import { Listing } from '@/types/listing';
import { useAuth } from '@/contexts/AuthContext';

export default function MyListingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserListings();
  }, []);

  const loadUserListings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userListings = await listingsService.getUserListings(user.id);
      setListings(userListings);
    } catch (error) {
      console.error('Error loading user listings:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={{ height: 24 }} />
      <View style={[styles.header, { marginTop: 10 }, isDark && styles.darkHeader]}>
        <FontAwesome 
          name="arrow-left" 
          size={24} 
          color={isDark ? '#fff' : '#000'} 
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Text style={[styles.title, isDark && styles.darkText]}>My Listings</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && styles.darkText]}>
            You haven't created any listings yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={({ item }) => (
            <ListingCard 
              item={item}
              tintColor={tintColor}
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
  },
  darkContainer: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
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
