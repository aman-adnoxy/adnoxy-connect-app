// import { useEffect, useState } from 'react';
// import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
// import { Text } from '@/components/Themed';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { usePlan } from '@/hooks/usePlan';
// import { listingsService } from '@/services/listings';
// import { Listing } from '@/types/listing';
// import { useColorScheme } from '@/components/useColorScheme';
// import Colors from '@/constants/Colors';
// import Ionicons from '@expo/vector-icons/Ionicons';
// import FontAwesome from '@expo/vector-icons/FontAwesome';
// import { MapView, Marker } from '@/components/MapView';
// import { ListingCard } from '@/components/ListingCard';

// export default function PlanDetailsScreen() {
//   const { id } = useLocalSearchParams();
//   const { plans } = usePlan();
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === 'dark';
//   const tintColor = Colors[colorScheme ?? 'light'].tint;
//   const router = useRouter();
//   const [plan, setPlan] = useState<any>(null);
//   const [listings, setListings] = useState<Listing[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchPlanAndListings = async () => {
//       setLoading(true);
//       const foundPlan = plans.find(p => p.id === id);
//       setPlan(foundPlan);
//       if (foundPlan && foundPlan.listings.length > 0) {
//         const fetchedListings = await Promise.all(
//           foundPlan.listings.map((listingId: string) => listingsService.getListingById(listingId))
//         );
//         setListings(fetchedListings.filter(Boolean));
//       } else {
//         setListings([]);
//       }
//       setLoading(false);
//     };
//     fetchPlanAndListings();
//   }, [id, plans]);

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color={tintColor} />
//       </View>
//     );
//   }

//   if (!plan) {
//     return (
//       <View style={styles.centered}>
//         <Text style={{ color: isDark ? '#fff' : '#000' }}>Plan not found</Text>
//       </View>
//     );
//   }

//   // Price summary
//   const totalPrice = listings.reduce((sum, l) => sum + (l.price || 0), 0);

//   const handleShare = async () => {
//     try {
//       await Share.share({
//         message: `Check out my plan: ${plan.name}\n${listings.map(l => l.title + ' - ₹' + l.price).join('\n')}`
//       });
//     } catch (error) {
//       // ignore
//     }
//   };

//   const handleExport = async () => {
//     const csvHeader = 'Title,Price,Address,Latitude,Longitude\n';
//     const csvRows = listings.map(l =>
//       `${l.title},${l.price},"${l.address}",${l.latitude},${l.longitude}`
//     ).join('\n');
//     const csvContent = csvHeader + csvRows;

//     try {
//       await Share.share({
//         message: 'Here is your plan data in CSV format:',
//         url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
//         title: `${plan.name}_listings.csv`,
//       });
//     } catch (error) {
//       alert('Error exporting data.');
//     }
//   };

//   return (
//     <ScrollView style={[styles.container, isDark && styles.darkContainer]}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
//         </TouchableOpacity>
//         <Text style={[styles.title, isDark && styles.darkText]}>{plan.name}</Text>
//         <View style={styles.backButton} />
//       </View>
//       <View style={styles.actionsRow}>
//         <TouchableOpacity style={[styles.actionButton, { backgroundColor: tintColor }]} onPress={handleShare}>
//           <FontAwesome name="share-alt" size={20} color="#fff" />
//           <Text style={styles.actionButtonText}>Share</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4CAF50' }]} onPress={handleExport}>
//           <FontAwesome name="file-excel-o" size={20} color="#fff" />
//           <Text style={styles.actionButtonText}>Export</Text>
//         </TouchableOpacity>
//       </View>
//       <View style={styles.summaryCard}>
//         <Text style={[styles.summaryTitle, isDark && styles.darkText]}>Plan Summary</Text>
//         <Text style={[styles.summaryText, isDark && styles.darkText]}>Total Listings: {listings.length}</Text>
//         <Text style={[styles.summaryText, isDark && styles.darkText]}>Total Price: ₹{totalPrice}</Text>
//         {plan.start_date && (
//           <Text style={[styles.summaryText, isDark && styles.darkText]}>Start Date: {new Date(plan.start_date).toLocaleDateString()}</Text>
//         )}
//         {plan.end_date && (
//           <Text style={[styles.summaryText, isDark && styles.darkText]}>End Date: {new Date(plan.end_date).toLocaleDateString()}</Text>
//         )}
//         <Text style={[styles.summaryText, isDark && styles.darkText]}>Created: {new Date(plan.created_at).toLocaleDateString()}</Text>
//       </View>
//       {listings.length > 0 && (
//         <View style={styles.mapContainer}>
//           <MapView
//             style={styles.map}
//             initialRegion={{
//               latitude: listings[0].latitude,
//               longitude: listings[0].longitude,
//               latitudeDelta: 0.05,
//               longitudeDelta: 0.05,
//             }}
//           >
//             {listings.map(listing => (
//               <Marker
//                 key={listing.id}
//                 coordinate={{ latitude: listing.latitude, longitude: listing.longitude }}
//                 title={listing.title}
//                 description={listing.address}
//               />
//             ))}
//           </MapView>
//           <TouchableOpacity
//             style={styles.expandButton}
//             onPress={() => router.push({
//               pathname: '/listing/ListingMapModal',
//               params: { listings: JSON.stringify(listings) }
//             })}
//           >
//             <Ionicons name="expand" size={24} color={isDark ? '#fff' : '#000'} />
//           </TouchableOpacity>
//         </View>
//       )}
//       <Text style={[styles.sectionTitle, isDark && styles.darkText]}>Listings in this Plan</Text>
//       {listings.map(listing => (
//         <ListingCard key={listing.id} item={listing} tintColor={tintColor} />
//       ))}
//       <View style={{ height: 40 }} />
//     </ScrollView>
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
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 32,
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
//   actionsRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: 12,
//     marginHorizontal: 20,
//     marginBottom: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//     marginLeft: 8,
//   },
//   actionButtonText: {
//     color: '#fff',
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   summaryCard: {
//     backgroundColor: '#f5f5f5',
//     borderRadius: 12,
//     padding: 20,
//     margin: 20,
//     marginBottom: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   summaryTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 6,
//   },
//   summaryText: {
//     fontSize: 14,
//     color: '#666',
//     marginBottom: 2,
//   },
//   mapContainer: {
//     height: 200,
//     marginHorizontal: 20,
//     marginBottom: 16,
//     borderRadius: 12,
//     overflow: 'hidden',
//   },
//   map: {
//     flex: 1,
//   },
//   expandButton: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: 'rgba(255,255,255,0.7)',
//     borderRadius: 20,
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginTop: 16,
//     marginLeft: 20,
//     marginBottom: 8,
//   },
// });
