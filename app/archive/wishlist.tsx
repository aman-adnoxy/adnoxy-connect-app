// import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
// import { Text, View } from '@/components/Themed';
// import { useColorScheme } from '@/components/useColorScheme';
// import Colors from '@/constants/Colors';
// import { router } from 'expo-router';
// import FontAwesome from '@expo/vector-icons/FontAwesome';
// import Ionicons from '@expo/vector-icons/Ionicons';
// import { usePlan } from '@/hooks/usePlan';
// import { Listing } from '@/types/listing';
// import { useAuth } from '@/contexts/AuthContext';

// export default function WishlistScreen() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === 'dark';
//   const tintColor = Colors[colorScheme ?? 'light'].tint;
//   const { user } = useAuth();
//   const { plans, loading, removeFromPlan } = usePlan();

//   const handleRemoveFromWishlist = async (listingId: string) => {
//     if (!user) return;
//     try {
//       await removeFromPlan(listingId);
//     } catch (error) {
//       console.error('Error removing from wishlist:', error);
//     }
//   };

//   if (!user) {
//     return (
//       <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
//         <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
//           <Ionicons name="lock-closed-outline" size={64} color={isDark ? '#888' : '#bbb'} style={{ marginBottom: 24 }} />
//           <Text style={{ color: isDark ? '#fff' : '#222', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 16 }}>
//             Please sign in to view this page
//           </Text>
//           <TouchableOpacity
//             style={{ backgroundColor: tintColor, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 }}
//             onPress={() => router.replace('/auth/login')}
//           >
//             <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Sign In</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (loading) {
//     return (
//       <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
//         <View style={[styles.loadingContainer, isDark && styles.darkLoadingContainer]}>
//           <ActivityIndicator size="large" color={tintColor} />
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (plans.length === 0) {
//     return (
//       <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
//         <View style={{ height: 24 }} />
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//             <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
//           </TouchableOpacity>
//           <Text style={[styles.title, isDark && styles.darkText]}>Wishlist</Text>
//           <View style={styles.backButton} />
//         </View>
//         <View style={styles.emptyContainer}>
//           <FontAwesome name="heart-o" size={64} color={isDark ? '#999' : '#666'} />
//           <Text style={[styles.emptyText, isDark && styles.darkText]}>
//             Your wishlist is empty
//           </Text>
//           <TouchableOpacity
//             style={[styles.browseButton, { backgroundColor: tintColor }]}
//             onPress={() => router.push('/')}
//           >
//             <Text style={styles.browseButtonText}>Browse Listings</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
//       <View style={{ height: 62 }} />
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
//         </TouchableOpacity>
//         <Text style={[styles.title, isDark && styles.darkText]}>Wishlist</Text>
//         <View style={styles.backButton} />
//       </View>
//       <FlatList
//         data={plans}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.planItem}
//             onPress={() => router.push(`/plan/${item.id}`)}
//           >
//             <Text style={styles.planTitle}>{item.title}</Text>
//           </TouchableOpacity>
//         )}
//         keyExtractor={item => item.id}
//         numColumns={2}
//         columnWrapperStyle={styles.row}
//         contentContainerStyle={styles.listContent}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   darkContainer: {
//     backgroundColor: '#000',
//   }, 
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 20,
//     paddingTop: 32,
//     marginBottom: 8,
//     backgroundColor: 'transparent',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#000',
//     backgroundColor: 'transparent',
//   },
//   darkText: {
//     color: '#fff',
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   listContent: {
//     padding: 8,
//   },
//   row: {
//     justifyContent: 'space-between',
//     paddingHorizontal: 8,
//     backgroundColor: 'transparent',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   darkLoadingContainer: {
//     backgroundColor: '#1a1a1a',
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   emptyText: {
//     fontSize: 18,
//     color: '#666',
//     marginTop: 16,
//     marginBottom: 24,
//   },
//   browseButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   browseButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   planItem: {
//     flex: 1,
//     padding: 8,
//   },
//   planTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#000',
//   },
// });