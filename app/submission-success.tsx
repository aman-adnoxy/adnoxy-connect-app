import { StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function SubmissionSuccessScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <View style={styles.content}>
        <Ionicons name="checkmark-circle-outline" size={100} color={tintColor} style={styles.icon} />
        <Text style={[Typography.h2, styles.title, isDark && styles.darkTitle]}>
          Successfully submitted for review
        </Text>
        <Text style={[Typography.body1, styles.message, isDark && styles.darkMessage]}>
          Your listing has been submitted and is now awaiting review. We will notify you once it's approved.
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: tintColor }]}
          onPress={() => router.push('/my-listings')}
        >
          <Text style={styles.buttonText}>View My Listings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.backToHomeButton]}
          onPress={() => router.push('/')}
        >
          <Text style={[styles.buttonText, styles.backToHomeButtonText]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkContainer: {
    backgroundColor: Colors.dark.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: Colors.light.text,
  },
  darkTitle: {
    color: Colors.dark.text,
  },
  message: {
    textAlign: 'center',
    marginBottom: 32,
    color: Colors.light.textSecondary,
  },
  darkMessage: {
    color: Colors.dark.textSecondary,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToHomeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.tint,
  },
  backToHomeButtonText: {
    color: Colors.light.tint,
  },
});
