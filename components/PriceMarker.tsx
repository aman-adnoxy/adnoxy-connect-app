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
    <View style={{ alignItems: 'center' }}>
      <View style={[
        styles.priceMarker,
        isSelected && styles.selectedPriceMarker,
        isDark && styles.darkPriceMarker,
      ]}>
        <Text style={[
          styles.priceMarkerText,
          isSelected && styles.selectedPriceMarkerText,
          isDark && styles.darkPriceMarkerText,
        ]}>
          ₹{price}
        </Text>
      </View>
      {/* Triangle pointer */}
      <View style={[
        styles.triangle,
        isSelected && styles.selectedTriangle,
        isDark && styles.darkTriangle,
      ]} />
    </View>
  );
};

const styles = StyleSheet.create({
  priceMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    minWidth: 60,
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
    fontSize: 15,
    textAlign: 'center',
  },
  darkPriceMarkerText: {
    color: '#fff',
  },
  selectedPriceMarkerText: {
    color: '#fff',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    alignSelf: 'center',
    marginTop: -1,
    borderStyle: 'solid',
  },
  darkTriangle: {
    borderTopColor: '#2a2a2a',
  },
  selectedTriangle: {
    borderTopColor: Colors.light.tint,
  },
});

export default PriceMarker;
