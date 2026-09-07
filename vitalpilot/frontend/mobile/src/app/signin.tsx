import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalPilotColors } from '@/constants/vitalpilot';

export default function SignInScreen() {
  const router = useRouter();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const emailIsValid = useMemo(() => {
    const value =
      email.trim();

    if (!value) {
      return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value
    );
  }, [email]);

  const canSubmit =
    emailIsValid &&
    password.trim().length > 0 &&
    !isSubmitting;

  function validateForm() {
    if (!email.trim()) {
      return 'Please enter your email address.';
    }

    if (!emailIsValid) {
      return 'Please enter a valid email address.';
    }

    if (!password.trim()) {
      return 'Please enter your password.';
    }

    return '';
  }

  async function handleSignIn() {
    const validationError =
      validateForm();

    if (validationError) {
      setMessage(
        validationError
      );

      return;
    }

    setMessage('');
    setIsSubmitting(true);

    try {
      /*
       * FRONTEND PROTOTYPE:
       *
       * Replace this with your actual
       * FastAPI authentication request
       * when the backend is ready.
       */

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            500
          )
      );

      router.replace('/home');
    } catch {
      setMessage(
        'Unable to sign in right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPassword() {
    /*
     * Replace this with a dedicated
     * password recovery route when
     * your authentication backend
     * supports it.
     */

    setMessage(
      'Password recovery will be available when authentication services are connected.'
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* Back */}
          <View style={styles.topRow}>
            <Pressable
              onPress={() =>
                router.back()
              }
              style={({ pressed }) => [
                styles.backButton,
                pressed &&
                  styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text
                style={
                  styles.backArrow
                }
              >
                ‹
              </Text>

              <Text
                style={
                  styles.backText
                }
              >
                Back
              </Text>
            </Pressable>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View
              style={
                styles.decorativeCircleLarge
              }
            />

            <View
              style={
                styles.decorativeCircleSmall
              }
            />

            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/images/vitalpilot/logo_green.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            <Text style={styles.brand}>
              VitalPilot
            </Text>

            <Text style={styles.heroTitle}>
              Welcome back
            </Text>

            <Text
              style={
                styles.heroSubtitle
              }
            >
              Securely access your health
              dashboard, reports, measurements,
              and Pilot AI.
            </Text>

            <View
              style={
                styles.heroFeatureRow
              }
            >
              <MiniFeature
                icon="♥"
                label="Track"
              />

              <MiniFeature
                icon="▤"
                label="Reports"
              />

              <MiniFeature
                icon="✦"
                label="Pilot AI"
              />
            </View>
          </View>

          {/* Sign-in card */}
          <View style={styles.formCard}>
            <View>
              <Text style={styles.formTitle}>
                Sign in
              </Text>

              <Text
                style={
                  styles.formSubtitle
                }
              >
                Enter your VitalPilot account
                information.
              </Text>
            </View>

            {/* Email */}
            <View
              style={styles.fieldSection}
            >
              <Text
                style={styles.label}
              >
                Email address
              </Text>

              <View
                style={[
                  styles.inputContainer,
                  email.length > 0 &&
                    !emailIsValid &&
                    styles.inputContainerError,
                ]}
              >
                <View
                  style={
                    styles.inputLeadingIcon
                  }
                >
                  <Text
                    style={
                      styles.inputLeadingIconText
                    }
                  >
                    @
                  </Text>
                </View>

                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setMessage('');
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor="#98A2B3"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  style={styles.input}
                  accessibilityLabel="Email address"
                />

                {email.length > 0 &&
                emailIsValid ? (
                  <View
                    style={
                      styles.validIcon
                    }
                  >
                    <Text
                      style={
                        styles.validIconText
                      }
                    >
                      ✓
                    </Text>
                  </View>
                ) : null}
              </View>

              {email.length > 0 &&
              !emailIsValid ? (
                <Text
                  style={
                    styles.fieldError
                  }
                >
                  Enter a valid email address.
                </Text>
              ) : null}
            </View>

            {/* Password */}
            <View
              style={styles.fieldSection}
            >
              <View
                style={
                  styles.passwordLabelRow
                }
              >
                <Text
                  style={styles.label}
                >
                  Password
                </Text>

                <Pressable
                  onPress={
                    handleForgotPassword
                  }
                >
                  <Text
                    style={
                      styles.forgotPassword
                    }
                  >
                    Forgot password?
                  </Text>
                </Pressable>
              </View>

              <View
                style={
                  styles.inputContainer
                }
              >
                <View
                  style={
                    styles.inputLeadingIcon
                  }
                >
                  <Text
                    style={
                      styles.inputLeadingIconText
                    }
                  >
                    ●
                  </Text>
                </View>

                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setMessage('');
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="#98A2B3"
                  secureTextEntry={
                    !showPassword
                  }
                  textContentType="password"
                  autoComplete="password"
                  style={styles.input}
                  accessibilityLabel="Password"
                />

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  style={
                    styles.visibilityButton
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  <Text
                    style={
                      styles.visibilityText
                    }
                  >
                    {showPassword
                      ? 'Hide'
                      : 'Show'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Message */}
            {message ? (
              <View
                style={styles.messageBox}
              >
                <View
                  style={
                    styles.messageIcon
                  }
                >
                  <Text
                    style={
                      styles.messageIconText
                    }
                  >
                    i
                  </Text>
                </View>

                <Text
                  style={
                    styles.messageText
                  }
                >
                  {message}
                </Text>
              </View>
            ) : null}

            {/* Sign In */}
            <Pressable
              onPress={handleSignIn}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.signInButton,

                !canSubmit &&
                  styles.signInButtonDisabled,

                pressed &&
                  canSubmit &&
                  styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text
                style={
                  styles.signInButtonText
                }
              >
                {isSubmitting
                  ? 'Signing In...'
                  : 'Sign In'}
              </Text>

              {!isSubmitting ? (
                <Text
                  style={
                    styles.signInArrow
                  }
                >
                  →
                </Text>
              ) : null}
            </Pressable>

            {/* Signup link */}
            <View
              style={
                styles.accountRow
              }
            >
              <Text
                style={
                  styles.accountText
                }
              >
                Don't have an account?
              </Text>

              <Pressable
                onPress={() =>
                  router.push('/signup')
                }
              >
                <Text
                  style={
                    styles.createAccount
                  }
                >
                  Create Account
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Security visual */}
          <View style={styles.securityCard}>
            <View
              style={
                styles.securityIcon
              }
            >
              <Text
                style={
                  styles.securityIconText
                }
              >
                ✓
              </Text>
            </View>

            <View
              style={
                styles.securityContent
              }
            >
              <Text
                style={
                  styles.securityTitle
                }
              >
                Your health information stays
                protected
              </Text>

              <Text
                style={
                  styles.securityText
                }
              >
                VitalPilot is designed to keep
                patient health information
                private and patient-controlled.
              </Text>
            </View>
          </View>

          {/* Prototype notice */}
          <View style={styles.prototypeCard}>
            <Text
              style={
                styles.prototypeTitle
              }
            >
              Authentication prototype
            </Text>

            <Text
              style={
                styles.prototypeText
              }
            >
              This frontend currently demonstrates
              the sign-in experience. Real account
              validation and authentication will be
              connected to the VitalPilot backend.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MiniFeature({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <View style={styles.miniFeature}>
      <View
        style={
          styles.miniFeatureIcon
        }
      >
        <Text
          style={
            styles.miniFeatureIconText
          }
        >
          {icon}
        </Text>
      </View>

      <Text
        style={styles.miniFeatureLabel}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: '#F5F9F7',
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 42,

    gap: 16,
  },

  /*
   * Top navigation
   */

  topRow: {
    minHeight: 44,

    justifyContent: 'center',
  },

  backButton: {
    alignSelf: 'flex-start',

    minHeight: 44,

    flexDirection: 'row',
    alignItems: 'center',

    paddingRight: 12,
  },

  backArrow: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 30,
    lineHeight: 30,

    marginRight: 3,
  },

  backText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 13,
    fontWeight: '700',
  },

  /*
   * Hero
   */

  hero: {
    position: 'relative',

    overflow: 'hidden',

    alignItems: 'center',

    backgroundColor: '#EAF8F0',

    borderWidth: 1,
    borderColor: '#D4EBDD',

    borderRadius: 26,

    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
  },

  decorativeCircleLarge: {
    position: 'absolute',

    width: 180,
    height: 180,

    borderRadius: 90,

    backgroundColor:
      'rgba(21, 148, 92, 0.07)',

    top: -75,
    right: -55,
  },

  decorativeCircleSmall: {
    position: 'absolute',

    width: 100,
    height: 100,

    borderRadius: 50,

    backgroundColor:
      'rgba(46, 126, 234, 0.05)',

    bottom: -42,
    left: -26,
  },

  logoCircle: {
    width: 72,
    height: 72,

    borderRadius: 36,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#D8E8DF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 51,
    height: 51,
  },

  brand: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 14,
    fontWeight: '900',

    marginTop: 8,
  },

  heroTitle: {
    color: '#101828',

    fontSize: 27,
    fontWeight: '900',

    marginTop: 11,
  },

  heroSubtitle: {
    maxWidth: 330,

    color: '#52635B',

    fontSize: 12,
    lineHeight: 19,

    textAlign: 'center',

    marginTop: 6,
  },

  heroFeatureRow: {
    flexDirection: 'row',

    marginTop: 19,

    gap: 10,
  },

  miniFeature: {
    minWidth: 78,

    alignItems: 'center',

    backgroundColor:
      'rgba(255,255,255,0.74)',

    borderRadius: 14,

    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  miniFeatureIcon: {
    width: 30,
    height: 30,

    borderRadius: 15,

    backgroundColor: '#DDF3E8',

    alignItems: 'center',
    justifyContent: 'center',
  },

  miniFeatureIconText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 13,
    fontWeight: '900',
  },

  miniFeatureLabel: {
    color: '#475467',

    fontSize: 9,
    fontWeight: '700',

    marginTop: 4,
  },

  /*
   * Form card
   */

  formCard: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E1E7E4',

    borderRadius: 22,

    padding: 18,

    gap: 17,
  },

  formTitle: {
    color: '#101828',

    fontSize: 22,
    fontWeight: '900',
  },

  formSubtitle: {
    color: '#667085',

    fontSize: 11,
    lineHeight: 17,

    marginTop: 4,
  },

  fieldSection: {
    gap: 7,
  },

  label: {
    color: '#344054',

    fontSize: 12,
    fontWeight: '800',
  },

  passwordLabelRow: {
    flexDirection: 'row',

    justifyContent:
      'space-between',

    alignItems: 'center',
  },

  forgotPassword: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 10,
    fontWeight: '800',
  },

  /*
   * Input
   */

  inputContainer: {
    minHeight: 56,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#D0D5DD',

    borderRadius: 15,

    overflow: 'hidden',
  },

  inputContainerError: {
    borderColor: '#F04438',
  },

  inputLeadingIcon: {
    width: 48,
    height: 54,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#F8FAF9',

    borderRightWidth: 1,
    borderRightColor: '#EAECF0',
  },

  inputLeadingIconText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 14,
    fontWeight: '900',
  },

  input: {
    flex: 1,

    minHeight: 54,

    paddingHorizontal: 13,

    color: '#101828',

    fontSize: 14,
  },

  visibilityButton: {
    minWidth: 54,
    minHeight: 54,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 10,
  },

  visibilityText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 10,
    fontWeight: '800',
  },

  validIcon: {
    width: 28,
    height: 28,

    borderRadius: 14,

    backgroundColor: '#EAF8F0',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  validIconText: {
    color: '#137A53',

    fontSize: 11,
    fontWeight: '900',
  },

  fieldError: {
    color: '#B42318',

    fontSize: 9,
    lineHeight: 14,
  },

  /*
   * Message
   */

  messageBox: {
    flexDirection: 'row',

    alignItems: 'flex-start',

    backgroundColor: '#FFF8EB',

    borderWidth: 1,
    borderColor: '#FEDF89',

    borderRadius: 13,

    padding: 11,

    gap: 8,
  },

  messageIcon: {
    width: 22,
    height: 22,

    borderRadius: 11,

    backgroundColor: '#F79009',

    alignItems: 'center',
    justifyContent: 'center',
  },

  messageIconText: {
    color: '#FFFFFF',

    fontSize: 10,
    fontWeight: '900',
  },

  messageText: {
    flex: 1,

    color: '#7A2E0E',

    fontSize: 10,
    lineHeight: 16,
  },

  /*
   * Sign In button
   */

  signInButton: {
    minHeight: 52,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      VitalPilotColors.primary,

    borderRadius: 15,

    paddingHorizontal: 16,

    gap: 8,
  },

  signInButtonDisabled: {
    backgroundColor: '#B8DCC8',
  },

  signInButtonText: {
    color: '#FFFFFF',

    fontSize: 14,
    fontWeight: '900',
  },

  signInArrow: {
    color: '#FFFFFF',

    fontSize: 16,
    fontWeight: '800',
  },

  /*
   * Account
   */

  accountRow: {
    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,
  },

  accountText: {
    color: '#667085',

    fontSize: 11,
  },

  createAccount: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 11,
    fontWeight: '900',
  },

  /*
   * Security
   */

  securityCard: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#EFF8F3',

    borderWidth: 1,
    borderColor: '#D7EADF',

    borderRadius: 17,

    padding: 14,

    gap: 11,
  },

  securityIcon: {
    width: 42,
    height: 42,

    borderRadius: 21,

    borderWidth: 2,
    borderColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  securityIconText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 14,
    fontWeight: '900',
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    color: '#101828',

    fontSize: 11,
    fontWeight: '800',
  },

  securityText: {
    color: '#667085',

    fontSize: 9,
    lineHeight: 15,

    marginTop: 3,
  },

  /*
   * Prototype
   */

  prototypeCard: {
    backgroundColor: '#F8FAF9',

    borderRadius: 14,

    padding: 13,
  },

  prototypeTitle: {
    color: '#475467',

    fontSize: 10,
    fontWeight: '800',
  },

  prototypeText: {
    color: '#667085',

    fontSize: 9,
    lineHeight: 15,

    marginTop: 4,
  },

  pressed: {
    opacity: 0.65,
  },
});