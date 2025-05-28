import React from 'react';
import { DimensionValue, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MapView as MapComponent } from './MapView'; // Import the wrapper component

interface StaticMapViewProps {
  latitude: number;
  longitude: number;
  height?: number;
  width?: DimensionValue;
}

const StaticMapView: React.FC<StaticMapViewProps> = ({
  latitude,
  longitude,
  height = 200,
  width = '100%',
}) => {
  const initialRegion = {
    latitude,
    longitude,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <MapComponent
      style={{ height, width, borderRadius: 8, overflow: 'hidden' }}
      initialRegion={initialRegion}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
      liteMode={true} // Use liteMode for a static, image-based map on Android
    >
      <Marker coordinate={{ latitude, longitude }} />
    </MapComponent>
  );
};

export default StaticMapView;
