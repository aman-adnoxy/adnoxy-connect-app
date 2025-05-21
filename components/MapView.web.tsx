import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import type { MapViewProps } from 'react-native-maps';

export const MapView = React.forwardRef<View, MapViewProps>((props, ref) => (
  <View ref={ref} style={[props.style, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', padding: 20 }]}> 
    <Text style={{ textAlign: 'center', color: '#666' }}>
      Map view is not available on web. Please use the search bar to select a location.
    </Text>
  </View>
));

export const Marker = () => null;
export const PROVIDER_GOOGLE = null; 