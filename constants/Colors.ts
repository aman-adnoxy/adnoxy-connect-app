const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    border: '#eee', // Added border color
    textSecondary: '#666', // Added secondary text color
    inputBackground: '#f2f2f2',
    cardBackground: '#fff', // Added card background color
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    border: '#333',
    textSecondary: '#999',
    inputBackground: '#1a1a1a',
    cardBackground: '#1c1c1c', // Added card background color for dark mode
  },
};
