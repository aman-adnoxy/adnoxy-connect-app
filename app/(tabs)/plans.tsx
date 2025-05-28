import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, SafeAreaView, View, TextInput, Modal, Image, Dimensions } from 'react-native';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  const { plans, createPlan } = usePlan();
  const [showModal, setShowModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [loading, setLoading] = useState(false);
  const [listingDetails, setListingDetails] = useState<Record<string, Listing>>({});

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

  const renderPlanCard = ({ item }: { item: Plan }) => {
    const planListings = item.listings
      .map(id => listingDetails[id])
      .filter((listing): listing is Listing => listing !== undefined)
      .slice(0, 4);

    const imageUrls = planListings.map(listing => listing.image_urls[0]);
    const remainingCount = Math.max(0, item.listings.length - 4);

    return (
      <TouchableOpacity
        style={[styles.planCard, isDark && styles.darkPlanCard]}
        onPress={() => router.push({ pathname: '/plan/[id]', params: { id: item.id } })}
      >
        <View style={styles.imageGrid}>
          {imageUrls.map((url: string, index: number) => (
            <Image
              key={index}
              source={{ uri: url }}
              style={[
                styles.gridImage,
                index === 0 && styles.mainImage,
                index > 0 && styles.smallImage
              ]}
            />
          ))}
          {remainingCount > 0 && (
            <View style={styles.remainingOverlay}>
              <Text style={styles.remainingText}>+{remainingCount}</Text>
            </View>
          )}
        </View>
        <View style={[styles.planInfo, isDark && styles.darkPlanInfo]}>
          <Text style={[styles.planName, isDark && styles.darkText]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.planMeta, isDark && styles.darkText]}>
            {item.listings.length} {item.listings.length === 1 ? 'listing' : 'listings'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDark && styles.darkText]}>My Plans</Text>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: '#FF5A5F' }]} 
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>New Plan</Text>
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
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    backgroundColor: 'transparent',
  },
  darkText: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
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
    backgroundColor: '#1a1a1a',
  },
  imageGrid: {
    width: '100%',
    height: COLUMN_WIDTH,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    backgroundColor: '#f0f0f0',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  smallImage: {
    width: '50%',
    height: '50%',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#fff',
  },
  remainingOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderBottomRightRadius: 12,
  },
  remainingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  planInfo: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  darkPlanInfo: {
    borderTopColor: '#333',
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