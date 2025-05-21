import { StyleSheet, Pressable, View as RNView, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { user, signOut } = useAuth();

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
          <Ionicons name="lock-closed-outline" size={64} color={isDark ? '#888' : '#bbb'} style={{ marginBottom: 24 }} />
          <Text style={{ color: isDark ? '#fff' : '#222', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
            Please sign in to view this page
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: tintColor, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 }}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={{ height: 24 }} />
      <View style={[styles.profileContainer, isDark && styles.darkProfileContainer]}>
        <View style={styles.avatarContainer}>
          <FontAwesome name="user-circle" size={80} color={tintColor} />
          <Text style={[Typography.h2, styles.name, isDark && styles.darkName]}>
            {user.email}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkSectionTitle]}>
            Account Settings
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
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
              { opacity: pressed ? 0.7 : 1 }
            ]}
            onPress={() => router.push('/my-orders')}
          >
            <FontAwesome name="shopping-cart" size={20} color={tintColor} />
            <Text style={[styles.menuItemText, isDark && styles.darkMenuItemText]}>
              My Orders
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[Typography.h3, styles.sectionTitle, isDark && styles.darkSectionTitle]}>
            Support
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.menuItem,
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
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  darkProfileContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  name: {
    marginTop: 16,
    color: '#000',
  },
  darkName: {
    color: '#fff',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#000',
  },
  darkSectionTitle: {
    color: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  darkMenuItemText: {
    color: '#fff',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    marginTop: 'auto',
  },
  signOutText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    marginBottom: 16,
    color: '#000',
    textAlign: 'center',
  },
  darkTitle: {
    color: '#fff',
  },
});