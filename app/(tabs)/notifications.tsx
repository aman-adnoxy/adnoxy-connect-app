import { StyleSheet, FlatList, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Typography } from '@/constants/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// TODO: Replace with actual notifications data from API/state management
const mockNotifications = [
  {
    id: '1',
    type: 'booking',
    title: 'New Booking Request',
    message: 'John Doe wants to book your "Professional Camera"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
  },
  {
    id: '2',
    type: 'wishlist',
    title: 'Wishlist Update',
    message: 'Your wishlisted item "DJI Drone" is now available',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: true,
  },
  {
    id: '3',
    type: 'system',
    title: 'Welcome to ADNOXY Connect',
    message: 'Get started by exploring listings and adding items to your wishlist',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
  },
];

function NotificationItem({ item }: { item: typeof mockNotifications[0] }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  const getIcon = () => {
    switch (item.type) {
      case 'booking':
        return 'calendar';
      case 'wishlist':
        return 'heart';
      case 'system':
        return 'bell';
      default:
        return 'bell';
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.notificationItem,
        isDark && styles.darkNotificationItem,
        !item.read && styles.unreadNotification,
        { opacity: pressed ? 0.7 : 1 }
      ]}
    >
      <View style={[styles.iconContainer, isDark && styles.darkIconContainer]}>
        <FontAwesome name={getIcon()} size={20} color={tintColor} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[Typography.body1, styles.title, isDark && styles.darkTitle]}>
          {item.title}
        </Text>
        <Text style={[Typography.body2, styles.message, isDark && styles.darkMessage]}>
          {item.message}
        </Text>
        <Text style={[Typography.caption, styles.timestamp, isDark && styles.darkTimestamp]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={{ height: 24 }} />
      <View style={[styles.header, { marginTop: 10 }]}>
        <Text style={[styles.title, isDark && styles.darkTitle]}>Notifications</Text>
      </View>
      <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
        You have no new notifications
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  darkTitle: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  darkSubtitle: {
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
  darkEmptyText: {
    color: '#999',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  darkNotificationItem: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  unreadNotification: {
    backgroundColor: '#f8f9fa',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  darkIconContainer: {
    backgroundColor: '#2a2a2a',
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    color: '#666',
    marginBottom: 4,
  },
  darkMessage: {
    color: '#999',
  },
  timestamp: {
    color: '#999',
  },
  darkTimestamp: {
    color: '#666',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
    position: 'absolute',
    top: 16,
    right: 16,
  },
}); 