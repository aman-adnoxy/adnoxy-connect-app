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
    warning: '#FFA500', // Orange
    warningBackground: 'rgba(255, 165, 0, 0.1)',
    success: '#4CAF50', // Green
    successBackground: 'rgba(76, 175, 80, 0.1)',
    error: '#FF3B30', // Red
    errorBackground: 'rgba(255, 59, 48, 0.1)',
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
    warning: '#FFD700', // Gold for dark mode
    warningBackground: 'rgba(255, 215, 0, 0.1)',
    success: '#81C784', // Light green for dark mode
    successBackground: 'rgba(129, 199, 132, 0.1)',
    error: '#CC2929', // Darker red for dark mode
    errorBackground: 'rgba(204, 41, 41, 0.1)',
  },
};
