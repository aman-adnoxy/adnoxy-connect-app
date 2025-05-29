import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { usePlan } from '@/hooks/usePlan';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Plan } from '@/types/plan';
import { Listing } from '@/types/listing';
import { Ionicons } from '@expo/vector-icons';

interface AddToPlanModalProps {
  visible: boolean;
  onClose: () => void;
  listing: Listing;
  onPlanAdded?: (plan: Plan) => void;
}

export default function AddToPlanModal({ visible, onClose, listing, onPlanAdded }: AddToPlanModalProps) {
  const { plans, addToPlan, createPlan } = usePlan();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const [creating, setCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [startDate, setStartDate] = useState(''); // For plan creation
  const [endDate, setEndDate] = useState('');     // For plan creation
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const isListingAvailable = (listing: Listing, planStartDateStr: string, planEndDateStr: string): boolean => {
    if (listing.is_unavailable) {
      return false;
    }

    const planStartDate = new Date(planStartDateStr);
    const planEndDate = new Date(planEndDateStr);

    const listingAvailabilityStart = listing.availability_start ? new Date(listing.availability_start) : null;
    const listingAvailabilityEnd = listing.availability_end ? new Date(listing.availability_end) : null;

    // If listing has no availability dates, assume it's always available
    if (!listingAvailabilityStart && !listingAvailabilityEnd) {
      return true;
    }

    // If listing has no availability dates, it's always available
    if (!listingAvailabilityStart && !listingAvailabilityEnd) {
      return true;
    }

    // If listing has only a start date, it's available from start date onwards
    if (listingAvailabilityStart && !listingAvailabilityEnd) {
      return planStartDate >= listingAvailabilityStart;
    }

    // If listing has only an end date, it's available until end date
    if (!listingAvailabilityStart && listingAvailabilityEnd) {
      return planEndDate <= listingAvailabilityEnd;
    }

    // If listing has both start and end dates, check if plan dates are a subset
    // Plan start date must be on or after listing availability start date
    // AND Plan end date must be on or before listing availability end date
    const isSubset =
      (planStartDate >= listingAvailabilityStart!) &&
      (planEndDate <= listingAvailabilityEnd!);

    return isSubset;
  };

  const handleAddToExisting = async (planId: string) => {
    setLoading(true);
    try {
      const targetPlan = plans.find(p => p.id === planId);
      if (!targetPlan) {
        Alert.alert('Error', 'Plan not found.');
        return;
      }

      if (!isListingAvailable(listing, targetPlan.start_date, targetPlan.end_date)) {
        Alert.alert('Availability Conflict', 'This listing is not available for the selected plan dates.');
        return;
      }

      await addToPlan(planId, listing);
      const updatedPlan = plans.find(p => p.id === planId);
      if (updatedPlan && onPlanAdded) {
        onPlanAdded(updatedPlan);
      }
      Alert.alert('Success', 'Listing added to your plan successfully.');
      onClose();
    } catch (e) {
      console.error('Error adding to plan:', e);
      Alert.alert('Error', 'Could not add to plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newPlanName.trim()) {
      Alert.alert('Error', 'Please enter a plan name');
      return;
    }
    setLoading(true);
    try {
      if (!isListingAvailable(listing, startDate, endDate)) {
        Alert.alert('Availability Conflict', 'This listing is not available for the specified plan dates.');
        return;
      }

      // Pass startDate and endDate to createPlan
      const newPlan = await createPlan(newPlanName.trim(), listing, startDate, endDate);
      if (onPlanAdded) {
        onPlanAdded(newPlan);
      }
      Alert.alert('Success', 'Plan created and listing added successfully.');
      setNewPlanName('');
      setStartDate('');
      setEndDate('');
      setCreating(false);
      onClose();
    } catch (e) {
      console.error('Error creating plan:', e);
      Alert.alert('Error', 'Could not create plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, isDark && styles.darkModal]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.title, isDark && styles.darkText]}>Save to Plan</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>
          
          {loading && <ActivityIndicator color={tintColor} style={{ marginVertical: 12 }} />}
          
          {!creating ? (
            <>
              <TouchableOpacity
                style={[styles.newPlanButton, { backgroundColor: '#FF5A5F' }]}
                onPress={() => setCreating(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.newPlanButtonText}>Create New Plan</Text>
              </TouchableOpacity>
              
              <FlatList
                data={plans}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.planItem, selectedPlanId === item.id && { borderColor: '#FF5A5F' }]}
                    onPress={() => handleAddToExisting(item.id)}
                    disabled={loading}
                  >
                    <View style={styles.planItemContent}>
                      <Text style={[styles.planName, isDark && styles.darkText]}>{item.name}</Text>
                      <Text style={[styles.planMeta, isDark && styles.darkText]}>
                        {item.listings.length} item{item.listings.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      size={20} 
                      color={isDark ? '#666' : '#999'} 
                    />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={48} color={isDark ? '#666' : '#999'} />
                    <Text style={[styles.emptyText, isDark && styles.darkText]}>No plans yet</Text>
                    <Text style={[styles.emptySubtext, isDark && styles.darkText]}>
                      Create your first plan to save listings
                    </Text>
                  </View>
                }
                style={styles.planList}
              />
            </>
          ) : (
            <View style={styles.createForm}>
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="Plan name"
                placeholderTextColor={isDark ? '#aaa' : '#888'}
                value={newPlanName}
                onChangeText={setNewPlanName}
                editable={!loading}
                autoFocus
              />
              {/* TODO: Implement a proper date picker for better UX */}
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="Start Date (YYYY-MM-DD)"
                placeholderTextColor={isDark ? '#aaa' : '#888'}
                value={startDate}
                onChangeText={setStartDate}
                editable={!loading}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={[styles.input, isDark && styles.darkInput]}
                placeholder="End Date (YYYY-MM-DD)"
                placeholderTextColor={isDark ? '#aaa' : '#888'}
                value={endDate}
                onChangeText={setEndDate}
                editable={!loading}
                keyboardType="numbers-and-punctuation"
              />
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: '#FF5A5F' }]}
                onPress={handleCreateAndAdd}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>Create & Add</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setCreating(false)} 
                disabled={loading}
              >
                <Text style={[styles.cancelText, isDark && styles.darkText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  darkModal: {
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  darkText: {
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  newPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  newPlanButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  planList: {
    marginTop: 8,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planItemContent: {
    flex: 1,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
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
  createForm: {
    width: '100%',
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
});
