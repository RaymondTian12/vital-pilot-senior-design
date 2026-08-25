import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalButton } from '@/components/vitalpilot/button';
import { VitalPilotLogo } from '@/components/vitalpilot/logo';
import { VitalPilotColors } from '@/constants/vitalpilot';
import { api } from '@/services/api';

export default function SignUpScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !confirmPassword) {
      setError('Please complete all fields.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      if (process.env.EXPO_PUBLIC_API_BASE_URL) {
        await api.signUp(trimmedEmail, password);
      }

      router.push('/questionnaire');
    } catch {
      setError(
        'Unable to create your account. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <VitalPilotLogo size={54} />
          </View>

          <Image
            source={require('@/assets/images/vitalpilot/signup_pic.png')}
            style={styles.image}
            contentFit="contain"
          />

          <Text style={styles.title}>
            Create your VitalPilot account
          </Text>

          <Text style={styles.subtitle}>
            Start tracking your health in one place.
          </Text>

          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="Email Address"
              placeholderTextColor="#98A2B3"
              style={styles.input}
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="Password"
              placeholderTextColor="#98A2B3"
              style={styles.input}
            />

            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              placeholder="Confirm Password"
              placeholderTextColor="#98A2B3"
              style={styles.input}
            />

            {error ? (
              <Text style={styles.error}>
                {error}
              </Text>
            ) : null}

            <VitalButton
              disabled={isSubmitting}
              onPress={handleSignUp}
            >
              {isSubmitting
                ? 'Creating Account...'
                : 'Continue'}
            </VitalButton>

            <Text style={styles.switchText}>
              Already have an account?{' '}
              <Text
                style={styles.link}
                onPress={() => router.push('/signin')}
              >
                Sign in
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VitalPilotColors.white,
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 14,
  },

  logoRow: {
    alignItems: 'center',
  },

  image: {
    width: '100%',
    height: 190,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: VitalPilotColors.title,
    textAlign: 'center',
  },

  subtitle: {
    color: '#667085',
    textAlign: 'center',
    marginBottom: 12,
  },

  form: {
    gap: 12,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: VitalPilotColors.title,
    backgroundColor: VitalPilotColors.white,
  },

  error: {
    color: VitalPilotColors.danger,
    fontSize: 14,
  },

  switchText: {
    textAlign: 'center',
    color: '#667085',
    marginTop: 4,
  },

  link: {
    color: VitalPilotColors.primaryDark,
    fontWeight: '700',
  },
});