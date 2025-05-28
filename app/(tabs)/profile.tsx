import { StyleSheet, Pressable, View as RNView, Alert, SafeAreaView, TouchableOpacity, TextInput } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { useState } from 'react';
import { usersService } from '@/services/users';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user, signOut, refreshUser } = useAuth();
  const { plans } = usePlan();

  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [otherDetails, setOtherDetails] = useState(user?.other_details || '');

  const handleUpdateAccountDetails = async () => {
    if (!user) return;
    try {
      await usersService.updateUser(user.id, {
        name,
        phone_number: phoneNumber,
        other_details: otherDetails,
      });
      await refreshUser(); // Refresh user context after update
      Alert.alert('Success', 'Account details updated successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update account details');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign out');
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <Ionicons name="lock-closed-outline" size={64} color={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary} style={{ marginBottom: 24 }} />
          <Text style={{ color: isDark ? Colors.dark.text : Colors.light.text, fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
            Please sign in to view this page
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: tintColor, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 }}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={{ color: Colors.light.background, fontSize: 16, fontWeight: '600' }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.profileHeader, isDark && styles.darkProfileHeader]}>
        <FontAwesome name="user-circle" size={80} color={Colors.light.background} />
        <Text style={[styles.profileEmail, isDark && styles.darkProfileEmail]}>
          {user.email}
        </Text>
      </View>

      <View style={[styles.profileContent, isDark && styles.darkProfileContent]}>
        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkSectionTitle]}>
            Account Settings
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              isDark && styles.darkMenuItem,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={() => router.push('/my-listings')}
          >
            <FontAwesome name="edit" size={20} color={tintColor} />
            <Text style={[styles.menuItemText, isDark && styles.darkMenuItemText]}>
              My Listings
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              isDark && styles.darkMenuItem,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={() => router.push('/my-orders')}
          >
            <FontAwesome name="shopping-cart" size={20} color={tintColor} />
            <Text style={[styles.menuItemText, isDark && styles.darkMenuItemText]}>
              My Orders
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              isDark && styles.darkMenuItem,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={() => router.push('/plans')}
          >
            <FontAwesome name="map" size={20} color={tintColor} />
            <Text style={[styles.menuItemText, isDark && styles.darkMenuItemText]}>
              My Plans ({plans?.length || 0})
            </Text>
          </Pressable>
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkSectionTitle]}>
            Account Details
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder="Name"
            placeholderTextColor={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder="Phone Number"
            placeholderTextColor={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder="Other Details"
            placeholderTextColor={isDark ? Colors.dark.textSecondary : Colors.light.textSecondary}
            value={otherDetails}
            onChangeText={setOtherDetails}
            multiline
          />
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              isDark && styles.darkSaveButton,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={handleUpdateAccountDetails}
          >
            <Text style={styles.saveButtonText}>Save Details</Text>
          </Pressable>
        </View>

        <View style={[styles.card, isDark && styles.darkCard]}>
          <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkSectionTitle]}>
            Support
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              isDark && styles.darkMenuItem,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={() => router.push('/notifications')}
          >
            <FontAwesome name="bell" size={20} color={tintColor} />
            <Text style={[styles.menuItemText, isDark && styles.darkMenuItemText]}>
              Notifications
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
              isDark && styles.darkMenuItem,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={() => router.push('/cart')}
          >
            <FontAwesome name="shopping-basket" size={20} color={tintColor} />
            <Text style={[styles.menuItemText, isDark && styles.darkMenuItemText]}>
              Cart
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.signOutButton,
            isDark && styles.darkSignOutButton,
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={handleSignOut}
        >
          <FontAwesome name="sign-out" size={20} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
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
  profileHeader: {
    backgroundColor: Colors.dark.cardBackground, // Black background as per image
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  darkProfileHeader: {
    backgroundColor: Colors.dark.cardBackground,
  },
  profileEmail: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.background, // White text for email
  },
  darkProfileEmail: {
    color: Colors.light.background,
  },
  profileContent: {
    flex: 1,
    paddingHorizontal: 24, // Adjusted padding
    backgroundColor: Colors.light.background,
  },
  darkProfileContent: {
    backgroundColor: Colors.dark.background,
  },
  card: {
    backgroundColor: Colors.dark.cardBackground, // Darker background for cards
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0, // No border as per image
    borderColor: 'transparent', // No border
  },
  darkCard: {
    backgroundColor: Colors.dark.cardBackground,
    shadowColor: '#fff',
    shadowOpacity: 0.05,
    borderColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: 16,
    color: Colors.light.text,
  },
  darkSectionTitle: {
    color: Colors.dark.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border, // Use dark border for consistency
    backgroundColor: 'transparent',
  },
  darkMenuItem: {
    borderBottomColor: Colors.dark.border,
  },
  menuItemText: {
    marginLeft: 16,
    fontSize: 17,
    color: Colors.light.text,
    flex: 1, // Take up remaining space
  },
  darkMenuItemText: {
    color: Colors.dark.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    marginTop: 'auto',
    width: '100%', // Full width
  },
  darkSignOutButton: {
    backgroundColor: '#CC2929', // A slightly darker red for dark mode
  },
  signOutText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 0, // No border
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.inputBackground, // Use light input background for light mode
  },
  darkInput: {
    borderColor: 'transparent',
    color: Colors.dark.text,
    backgroundColor: Colors.dark.cardBackground, // Use dark card background for inputs in dark mode
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  darkSaveButton: {
    backgroundColor: Colors.dark.tint,
  },
  saveButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
