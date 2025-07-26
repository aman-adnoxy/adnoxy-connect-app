import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Tabs } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import { CartProvider } from '@/hooks/useCart';
import { PlanProvider } from '@/hooks/usePlan';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize AsyncStorage for web
if (typeof window !== 'undefined') {
  const mockLocalStorage = {
    getItem: (key: string) => {
      try {
        // Use a synchronous wrapper
        let result: string | null = null;
        AsyncStorage.getItem(key).then(value => {
          result = value;
        }).catch(error => {
          console.error('Error getting item from AsyncStorage:', error);
        });
        return result;
      } catch (error) {
        console.error('Error in getItem:', error);
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        AsyncStorage.setItem(key, value).catch(error => {
          console.error('Error setting item in AsyncStorage:', error);
        });
      } catch (error) {
        console.error('Error in setItem:', error);
      }
    },
    removeItem: (key: string) => {
      try {
        AsyncStorage.removeItem(key).catch(error => {
          console.error('Error removing item from AsyncStorage:', error);
        });
      } catch (error) {
        console.error('Error in removeItem:', error);
      }
    },
    length: 0,
    clear: () => {
      try {
        AsyncStorage.clear().catch(error => {
          console.error('Error clearing AsyncStorage:', error);
        });
      } catch (error) {
        console.error('Error in clear:', error);
      }
    },
    key: (index: number) => null,
  };

  window.localStorage = mockLocalStorage;
}

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(console.error);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <PlanProvider>
        <CartProvider>
          <RootLayoutNav />
        </CartProvider>
      </PlanProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ 
          title: 'Login',
          headerShown: false,
        }} />
        <Stack.Screen name="auth/signup" options={{ 
          title: 'Sign Up',
          headerShown: false,
        }} />
        <Stack.Screen name="listing/[id]" options={{ 
          title: 'Listing Details',
          headerBackTitle: 'Back',
        }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="my-listings" options={{ headerShown: false }} />
        <Stack.Screen name="listing/edit/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

function TabsLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#fff',
          borderTopColor: colorScheme === 'dark' ? '#333' : '#ddd',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="heart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-listing"
        options={{
          title: 'Add Listing',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="plus-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}
