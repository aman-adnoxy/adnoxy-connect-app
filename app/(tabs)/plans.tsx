import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, SafeAreaView, View, TextInput, Modal, Image, Dimensions, Alert, Pressable } from 'react-native';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation
import { Listing } from '@/types/listing';
import { Plan } from '@/types/plan';
import { listingsService } from '@/services/listings';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 2 columns with padding

export default function PlansScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user } = useAuth();
  const { plans, createPlan, deletePlan, refreshPlans } = usePlan(); // Destructure refreshPlans
  const navigation = useNavigation(); // Initialize useNavigation
  const [showModal, setShowModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [loading, setLoading] = useState(false);
  const [listingDetails, setListingDetails] = useState<Record<string, Listing>>({});
  const [editMode, setEditMode] = useState(false); // New state for edit mode

  useEffect(() => {
    const fetchListingDetails = async () => {
      const listingIds = plans.flatMap(plan => plan.listings);
      const uniqueIds = [...new Set(listingIds)];
      
      const details: Record<string, Listing> = {};
      for (const id of uniqueIds) {
        try {
          const listing = await listingsService.getListingById(id);
          if (listing) {
            details[id] = listing;
          }
        } catch (error) {
          console.error('Error fetching listing:', error);
        }
      }
      setListingDetails(details);
    };

    if (plans.length > 0) {
      fetchListingDetails();
    }
  }, [plans]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // When the screen comes into focus, reload the plans
      if (user) {
        refreshPlans(); // Call refreshPlans
      }
    });

    return unsubscribe;
  }, [navigation, user, refreshPlans]); // Add refreshPlans to dependency array

  const handleCreatePlan = async () => {
    if (!planName.trim()) return;
    setLoading(true);
    try {
      await createPlan(planName.trim());
      setPlanName('');
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    Alert.alert(
      'Delete this plan?',
      `${planName} will be permanently deleted.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deletePlan(planId); // Uncommented the actual delete call
              console.log(`Deleting plan with ID: ${planId}`); // Keep for confirmation
            } catch (error) {
              console.error('Error deleting plan:', error);
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const renderPlanCard = ({ item }: { item: Plan }) => {
    const planListings = item.listings
      .map(id => listingDetails[id])
      .filter((listing): listing is Listing => listing !== undefined)
      .slice(0, 4);

    const imageUrls = planListings.map(listing => listing.image_urls[0]);
    const coverImageUrl = imageUrls[0];

    return (
      <Pressable
        style={[styles.planCard, isDark && styles.darkPlanCard]}
        onPress={() => router.push({ pathname: '/plan/[id]', params: { id: item.id } })}
      >
        <View style={styles.imageContainer}>
          {coverImageUrl ? (
            <Image
              source={{ uri: coverImageUrl }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={48} color={isDark ? '#666' : '#999'} />
            </View>
          )}
          {editMode && (
            <TouchableOpacity 
              style={styles.deleteIconContainer} 
              onPress={() => handleDeletePlan(item.id, item.name)}
            >
              <Ionicons name="close-circle" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.planInfo]}>
          <Text style={[styles.planName, isDark && styles.darkText]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.planMeta, isDark && styles.darkText]}>
            {item.listings.length} {item.listings.length === 1 ? 'listing' : 'listings'}
          </Text>
          <Text style={[styles.planDate, isDark && styles.darkDate]}>
             {item.start_date.toLocaleString()} - {item.end_date.toLocaleString()}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>My Plans</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text style={[styles.editText, isDark && styles.darkText]}>{editMode ? 'Done' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={plans}
        renderItem={renderPlanCard}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyText, isDark && styles.darkText]}>No plans yet</Text>
            <Text style={[styles.emptySubtext, isDark && styles.darkText]}>
              Create your first plan to save listings
            </Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, isDark && styles.darkModal]}>
            <Text style={[styles.modalTitle, isDark && styles.darkText]}>Create New Plan</Text>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder="Plan name"
              placeholderTextColor={isDark ? '#aaa' : '#888'}
              value={planName}
              onChangeText={setPlanName}
              editable={!loading}
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.createButton, { backgroundColor: '#FF5A5F' }]} 
              onPress={handleCreatePlan} 
              disabled={loading}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)} disabled={loading}>
              <Text style={[styles.cancelText, isDark && styles.darkText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 80, // Increased padding for more space at the top
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32, // Larger font size
    fontWeight: '800', // Bolder font weight
    color: '#000',
    backgroundColor: 'transparent',
  },
  darkText: {
    color: '#fff',
  },
  // Removed addButton and addButtonText styles as they are not part of the Airbnb header design.
  editText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000', // Adjust color as per Airbnb design
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  planCard: {
    width: COLUMN_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkPlanCard: {
    backgroundColor: 'transparent',
  },
  imageContainer: {
    width: '100%',
    height: COLUMN_WIDTH, // Approximately 4:3 aspect ratio
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0', // Placeholder background
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0', // Lighter placeholder background
    borderRadius: 12,
  },
  deleteIconContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1, // Ensure it's above the image
  },
  planInfo: {
    padding: 8, 
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  planMeta: {
    fontSize: 14,
    color: '#666',
  },
  planDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  darkDate: {
    color: '#ccc',
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  darkModal: {
    backgroundColor: '#1a1a1a',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
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
  createButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
});
