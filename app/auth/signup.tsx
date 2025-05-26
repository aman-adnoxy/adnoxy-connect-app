import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View as RNView, Alert, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const { error } = await signUp({ email, password });
      
      if (error) throw error;

      Alert.alert(
        'Verification Required',
        'Please check your email for a confirmation link. You need to verify your email before you can sign in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      {/* Only show the cross button, route to explore page */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 16, marginTop: 24 }}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}> 
          <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>
      <View style={[styles.formContainer, isDark && styles.darkFormContainer]}>
        <Text style={[Typography.h2, styles.title, isDark && styles.darkTitle]}>
          Create Account
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Email</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={isDark ? '#666' : '#999'}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Password</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={isDark ? '#666' : '#999'}
            secureTextEntry
            autoComplete="password-new"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[Typography.body1, styles.label, isDark && styles.darkLabel]}>Confirm Password</Text>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            placeholderTextColor={isDark ? '#666' : '#999'}
            secureTextEntry
            autoComplete="password-new"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: tintColor },
            { opacity: pressed ? 0.7 : 1 }
          ]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Sign Up</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push('/auth/login')}
          style={({ pressed }) => [
            styles.linkButton,
            { opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Text style={[styles.linkText, isDark && styles.darkLinkText]}>
            Already have an account? Login
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
  },
  darkFormContainer: {
    backgroundColor: '#1a1a1a',
  },
  title: {
    marginBottom: 32,
    color: '#000',
    textAlign: 'center',
  },
  darkTitle: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#000',
  },
  darkLabel: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fff',
  },
  darkInput: {
    borderColor: '#333',
    color: '#fff',
    backgroundColor: '#2a2a2a',
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  darkLinkText: {
    color: '#0A84FF',
  },
});