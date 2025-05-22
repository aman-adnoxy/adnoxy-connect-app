import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

interface SimplePlacesSearchProps {
  onPlaceSelected: (data: any, details: any) => void;
}

export default function SimplePlacesSearch({ onPlaceSelected }: SimplePlacesSearchProps) {
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder="Search for a place"
        onPress={(data, details = null) => {
          onPlaceSelected(data, details);
        }}
        query={{
          key: 'AIzaSyDBu0mE3-x_rXqwjf1eUej7-7YDjhvbMPs', // Use your actual API key
          language: 'en',
          types: 'geocode',
        }}
        fetchDetails={true}
        enablePoweredByContainer={false}
        minLength={2}
        debounce={300}
        onFail={error => console.error('GooglePlacesAutocomplete Error:', error)}
        onNotFound={() => console.log('No results found')}
        styles={{
          container: {
            flex: 0,
            position: 'absolute',
            width: '100%',
            zIndex: 1,
            paddingHorizontal: 10,
            paddingTop: 10,
          },
          textInput: {
            height: 48,
            borderRadius: 8,
            paddingHorizontal: 16,
            fontSize: 16,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          listView: {
            backgroundColor: '#fff',
            borderRadius: 8,
            marginTop: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          row: {
            padding: 13,
            height: 'auto',
            flexDirection: 'row',
          },
          description: {
            color: '#000',
          },
          separator: {
            height: 1,
            backgroundColor: '#eee',
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
