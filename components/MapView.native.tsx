import React from 'react';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { MapViewProps } from 'react-native-maps';

// Create a wrapper component that handles the provider
const MapComponent = React.forwardRef<any, MapViewProps>((props, ref) => {
  const provider = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;
  return <MapView ref={ref} {...props} provider={provider} />;
});

export type { MapViewProps };
export { MapComponent as MapView, Marker, PROVIDER_GOOGLE }; 