import { registerRootComponent } from 'expo';
import { Slot } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Failed prop type',
  'Non-serializable values were found in the navigation state',
]);

// Must be exported or Fast Refresh won't update the context
export default function App() {
  return <Slot />;
}

registerRootComponent(App); 