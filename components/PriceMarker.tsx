import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface PriceMarkerProps {
  price: number;
  isSelected: boolean;
}

const PriceMarker: React.FC<PriceMarkerProps> = ({ price, isSelected }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.priceMarker,
      isSelected && styles.selectedPriceMarker,
      isDark && styles.darkPriceMarker, // Apply dark mode styles if needed
    ]}>
      <Text style={[
        styles.priceMarkerText,
        isSelected && styles.selectedPriceMarkerText,
        isDark && styles.darkPriceMarkerText, // Apply dark mode styles if needed
      ]}>
        ₹{price}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  priceMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderColor: '#ccc',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkPriceMarker: {
    backgroundColor: '#2a2a2a',
    borderColor: '#555',
  },
  selectedPriceMarker: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  priceMarkerText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  darkPriceMarkerText: {
    color: '#fff',
  },
  selectedPriceMarkerText: {
    color: '#fff', // Text color when selected
  },
});

export default PriceMarker;
