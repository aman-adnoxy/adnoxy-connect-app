import 'react-native-get-random-values'; // Polyfill for crypto.getRandomValues

// Polyfills for Node environment
if (typeof window === 'undefined') {
  global.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    },
  };
  global.localStorage = global.window.localStorage;
  global.navigator = {
    userAgent: 'node',
  };
}
