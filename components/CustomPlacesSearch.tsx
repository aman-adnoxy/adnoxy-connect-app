import React, { useState } from 'react';
import { View, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { Text } from '@/components/Themed'; // Assuming Themed Text is desired
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from '@/components/useColorScheme'; // For dark mode styles

interface PlacePrediction {
  place_id: string;
  description: string;
}

interface CustomPlacesSearchProps {
  onPlaceSelected: (data: { description: string }, details: any | null) => void;
  googlePlacesApiKey: string;
  initialRegion?: { latitude: number; longitude: number }; // Optional for biasing
}

export default function CustomPlacesSearch({ onPlaceSelected, googlePlacesApiKey, initialRegion }: CustomPlacesSearchProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);

  const fetchPlaces = async (text: string) => {
    if (!text) {
      setSuggestions([]);
      return;
    }
    try {
      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=${googlePlacesApiKey}&input=${text}&language=en&components=country:in`; // Removed &types=geocode
      
      if (initialRegion) { // Add types=establishment if needed for specific business search
        url += `&location=${initialRegion.latitude},${initialRegion.longitude}&radius=50000`;
      }

      const response = await fetch(url);
      const json = await response.json();
      if (json.predictions) {
        setSuggestions(json.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setSuggestions([]);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?key=${googlePlacesApiKey}&place_id=${placeId}&fields=geometry`
      );
      const json = await response.json();
      if (json.result && json.result.geometry) {
        return json.result;
      }
      return null;
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchInputWrapper, isDark && styles.darkSearchInputWrapper]}>
        <TextInput
          style={[styles.searchInput, isDark && styles.darkSearchInput]}
          placeholder="Search location"
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            fetchPlaces(text);
          }}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => {
              setSearchText('');
              setSuggestions([]);
            }}
          >
            <Ionicons name="close-circle" size={20} color={isDark ? '#999' : '#666'} />
          </TouchableOpacity>
        )}
      </View>
      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.suggestionItem, isDark && styles.darkSuggestionItem]}
              onPress={async () => {
                setSearchText(item.description);
                setSuggestions([]); // Clear suggestions after selection
                const details = await getPlaceDetails(item.place_id);
                onPlaceSelected({ description: item.description }, details);
              }}
            >
              <Text style={[styles.suggestionText, isDark && styles.darkSuggestionText]}>
                {item.description}
              </Text>
            </TouchableOpacity>
          )}
          style={[styles.searchResults, isDark && styles.darkSearchResults]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkSearchInputWrapper: {
    backgroundColor: '#2a2a2a',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#000',
  },
  darkSearchInput: {
    color: '#fff',
  },
  clearSearchButton: {
    marginLeft: 10,
    padding: 5,
  },
  searchResults: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkSearchResults: {
    backgroundColor: '#2a2a2a', // Dark background for search results in dark mode
  },
  suggestionItem: {
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  darkSuggestionItem: {
    borderBottomColor: '#333',
  },
  suggestionText: {
    color: '#000',
  },
  darkSuggestionText: {
    color: '#fff',
  },
});
