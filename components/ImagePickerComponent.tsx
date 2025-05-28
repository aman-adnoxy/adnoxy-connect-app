import React from 'react';
import { StyleSheet, Pressable, Image, View as RNView, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/Colors'; // Assuming Colors is needed for styling

interface ImagePickerComponentProps {
  images: { uri: string, mimeType: string }[];
  setImages: React.Dispatch<React.SetStateAction<{ uri: string, mimeType: string }[]>>;
  loading: boolean;
  tintColor: string;
  isDark: boolean;
}

export default function ImagePickerComponent({ images, setImages, loading, tintColor, isDark }: ImagePickerComponentProps) {

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImage = { uri: result.assets[0].uri, mimeType: result.assets[0].mimeType || 'application/octet-stream' };
        setImages(prevImages => [...prevImages, newImage]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const renderImageTile = (imageObject?: { uri: string, mimeType: string }, index?: number) => {
    const isPlaceholder = !imageObject;
    const showAddButton = isPlaceholder && images.length < 5;

    return (
      <RNView 
        key={imageObject?.uri || `placeholder-${index}`}
        style={[
          styles.imageTile,
          isDark && styles.darkImageTile,
          styles.shadow
        ]}
      >
        {showAddButton ? (
          <Pressable
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.addButton,
              { opacity: pressed ? 0.7 : 1 }
            ]}
          >
            <FontAwesome name="plus" size={32} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.addButtonText, isDark && styles.darkAddButtonText]}>
              Add Photo
            </Text>
          </Pressable>
        ) : imageObject?.uri ? (
          <RNView style={styles.imageContainer}>
            <Image source={{ uri: imageObject.uri }} style={styles.image} resizeMode="contain" />
            <Pressable
              onPress={() => handleRemoveImage(index!)}
              style={({ pressed }) => [
                styles.removeButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <FontAwesome name="times" size={20} color="#fff" />
            </Pressable>
          </RNView>
        ) : null}
      </RNView>
    );
  };

  return (
    <View style={styles.imageSection}>
      <Text style={[styles.label, isDark && styles.darkLabel]}>
        Images ({images.length}/5)
      </Text>
      <View style={styles.imageGrid}>
        {loading && (
          <RNView style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
          </RNView>
        )}
        <View style={styles.gridRow}>
          {images.map((imageObject, index) => renderImageTile(imageObject, index))}
          {images.length < 5 && renderImageTile(undefined, images.length)}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageSection: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  label: {
    marginBottom: 8,
    color: Colors.light.text,
    fontWeight: '600',
  },
  darkLabel: {
    color: Colors.dark.text,
  },
  imageGrid: {
    backgroundColor: 'transparent',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Changed to space-between to distribute items evenly
    marginHorizontal: -5, // Keep this for overall grid alignment
  },
  imageTile: {
    width: '47%', // Adjusted width to ensure two columns with spacing
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginVertical: 5,
    marginHorizontal: '1.5%', // Adjusted horizontal margin to create space between items
    aspectRatio: 1, // Maintain square aspect ratio
    position: 'relative',
    height: 0, // Set height to 0 to allow aspect ratio to define height
  },
  darkImageTile: {
    backgroundColor: Colors.dark.cardBackground,
    borderColor: Colors.dark.border,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  darkAddButtonText: {
    color: Colors.dark.textSecondary,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
