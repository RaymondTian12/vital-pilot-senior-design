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

export default function SignUpScreen() {
  const router = useRouter();

  const [firstName, setFirstName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const emailIsValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim()
    );
  }, [email]);

  const passwordRules = useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special:
        /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordIsValid =
    passwordRules.length &&
    passwordRules.uppercase &&
    passwordRules.number &&
    passwordRules.special;

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailIsValid &&
    passwordIsValid &&
    passwordsMatch &&
    acceptedTerms &&
    !isSubmitting;

  function validateForm() {
    if (!firstName.trim()) {
      return 'Please enter your first name.';
    }

    if (!lastName.trim()) {
      return 'Please enter your last name.';
    }

    if (!email.trim()) {
      return 'Please enter your email address.';
    }

    if (!emailIsValid) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Please create a password.';
    }

    if (!passwordIsValid) {
      return 'Your password does not meet all requirements.';
    }

    if (!confirmPassword) {
      return 'Please confirm your password.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    if (!acceptedTerms) {
      return 'Please review and accept the Terms and Privacy Policy.';
    }

    return '';
  }

  async function handleSignUp() {
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
       * FRONTEND PROTOTYPE
       *
       * Replace this with your FastAPI
       * registration request when the
       * authentication backend is ready.
       */

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            600
          )
      );

      /*
       * After account creation, keep
       * health-specific onboarding in
       * the Questionnaire screen.
       */
      router.replace('/questionnaire');
    } catch {
      setMessage(
        'Unable to create your account right now. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
              Start your health journey
            </Text>

            <Text
              style={
                styles.heroSubtitle
              }
            >
              Create a secure account, then
              personalize VitalPilot around the
              health information you choose to
              track.
            </Text>

            <View style={styles.progressCard}>
              <View
                style={
                  styles.progressHeader
                }
              >
                <Text
                  style={
                    styles.progressLabel
                  }
                >
                  ACCOUNT SETUP
                </Text>

                <Text
                  style={
                    styles.progressStep
                  }
                >
                  Step 1 of 2
                </Text>
              </View>

              <View
                style={
                  styles.progressTrack
                }
              >
                <View
                  style={
                    styles.progressFill
                  }
                />
              </View>

              <Text
                style={
                  styles.progressText
                }
              >
                Next: Personalize your health
                tracking preferences
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View>
              <Text style={styles.formTitle}>
                Create account
              </Text>

              <Text
                style={
                  styles.formSubtitle
                }
              >
                Set up your secure VitalPilot
                account.
              </Text>
            </View>

            {/* Name */}
            <View style={styles.nameRow}>
              <View
                style={
                  styles.nameField
                }
              >
                <Text style={styles.label}>
                  First name
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <TextInput
                    value={firstName}
                    onChangeText={(value) => {
                      setFirstName(value);
                      setMessage('');
                    }}
                    placeholder="John"
                    placeholderTextColor="#98A2B3"
                    autoCapitalize="words"
                    textContentType="givenName"
                    autoComplete="name-given"
                    style={styles.input}
                    accessibilityLabel="First name"
                  />
                </View>
              </View>

              <View
                style={
                  styles.nameField
                }
              >
                <Text style={styles.label}>
                  Last name
                </Text>

                <View
                  style={
                    styles.inputContainer
                  }
                >
                  <TextInput
                    value={lastName}
                    onChangeText={(value) => {
                      setLastName(value);
                      setMessage('');
                    }}
                    placeholder="Doe"
                    placeholderTextColor="#98A2B3"
                    autoCapitalize="words"
                    textContentType="familyName"
                    autoComplete="name-family"
                    style={styles.input}
                    accessibilityLabel="Last name"
                  />
                </View>
              </View>
            </View>

            {/* Email */}
            <View
              style={styles.fieldSection}
            >
              <Text style={styles.label}>
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
              <Text style={styles.label}>
                Password
              </Text>

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
                  placeholder="Create a password"
                  placeholderTextColor="#98A2B3"
                  secureTextEntry={
                    !showPassword
                  }
                  textContentType="newPassword"
                  autoComplete="new-password"
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

              {password.length > 0 ? (
                <View
                  style={
                    styles.passwordRequirements
                  }
                >
                  <Text
                    style={
                      styles.passwordRequirementsTitle
                    }
                  >
                    Password requirements
                  </Text>

                  <PasswordRule
                    met={
                      passwordRules.length
                    }
                    text="At least 8 characters"
                  />

                  <PasswordRule
                    met={
                      passwordRules.uppercase
                    }
                    text="One uppercase letter"
                  />

                  <PasswordRule
                    met={
                      passwordRules.number
                    }
                    text="One number"
                  />

                  <PasswordRule
                    met={
                      passwordRules.special
                    }
                    text="One special character"
                  />
                </View>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View
              style={styles.fieldSection}
            >
              <Text style={styles.label}>
                Confirm password
              </Text>

              <View
                style={[
                  styles.inputContainer,

                  confirmPassword.length >
                    0 &&
                    !passwordsMatch &&
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
                    ●
                  </Text>
                </View>

                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(
                      value
                    );

                    setMessage('');
                  }}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#98A2B3"
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  textContentType="newPassword"
                  autoComplete="new-password"
                  style={styles.input}
                  accessibilityLabel="Confirm password"
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current
                    )
                  }
                  style={
                    styles.visibilityButton
                  }
                >
                  <Text
                    style={
                      styles.visibilityText
                    }
                  >
                    {showConfirmPassword
                      ? 'Hide'
                      : 'Show'}
                  </Text>
                </Pressable>

                {passwordsMatch ? (
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

              {confirmPassword.length >
                0 &&
              !passwordsMatch ? (
                <Text
                  style={
                    styles.fieldError
                  }
                >
                  Passwords do not match.
                </Text>
              ) : null}
            </View>

            {/* Terms */}
            <Pressable
              onPress={() =>
                setAcceptedTerms(
                  (current) =>
                    !current
                )
              }
              style={styles.termsRow}
              accessibilityRole="checkbox"
              accessibilityState={{
                checked: acceptedTerms,
              }}
            >
              <View
                style={
                  acceptedTerms
                    ? styles.checkboxSelected
                    : styles.checkbox
                }
              >
                {acceptedTerms ? (
                  <Text
                    style={
                      styles.checkboxCheck
                    }
                  >
                    ✓
                  </Text>
                ) : null}
              </View>

              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text
                  style={
                    styles.termsLink
                  }
                >
                  Terms of Use
                </Text>{' '}
                and{' '}
                <Text
                  style={
                    styles.termsLink
                  }
                >
                  Privacy Policy
                </Text>
                .
              </Text>
            </Pressable>

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

            {/* Create Account */}
            <Pressable
              onPress={handleSignUp}
              disabled={!canSubmit}
              style={({ pressed }) => [
                styles.createButton,

                !canSubmit &&
                  styles.createButtonDisabled,

                pressed &&
                  canSubmit &&
                  styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              <Text
                style={
                  styles.createButtonText
                }
              >
                {isSubmitting
                  ? 'Creating Account...'
                  : 'Create Account'}
              </Text>

              {!isSubmitting ? (
                <Text
                  style={
                    styles.createArrow
                  }
                >
                  →
                </Text>
              ) : null}
            </Pressable>

            {/* Sign in */}
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
                Already have an account?
              </Text>

              <Pressable
                onPress={() =>
                  router.push('/signin')
                }
              >
                <Text
                  style={
                    styles.signInLink
                  }
                >
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Privacy */}
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
                Patient-controlled health data
              </Text>

              <Text
                style={
                  styles.securityText
                }
              >
                Creating an account does not
                automatically share your health
                information with healthcare
                providers.
              </Text>
            </View>
          </View>

          {/* Why VitalPilot */}
          <View style={styles.benefitCard}>
            <Text
              style={
                styles.benefitTitle
              }
            >
              Your VitalPilot account gives you
              access to
            </Text>

            <BenefitRow
              icon="♥"
              title="Health Tracking"
              text="Record selected health measurements in one place."
              color="#15945C"
              background="#EAF8F0"
            />

            <BenefitRow
              icon="▤"
              title="Health Reports"
              text="Review summaries and trends from your recorded information."
              color="#2E7EEA"
              background="#EAF2FF"
            />

            <BenefitRow
              icon="✦"
              title="Pilot AI"
              text="Ask questions about your health information and trends."
              color="#8752D4"
              background="#F1EBFC"
            />
          </View>

          {/* Prototype */}
          <View style={styles.prototypeCard}>
            <Text
              style={
                styles.prototypeTitle
              }
            >
              Registration prototype
            </Text>

            <Text
              style={
                styles.prototypeText
              }
            >
              Account creation is currently a
              frontend demonstration. Real account
              registration, duplicate-email
              detection, password storage, and
              authentication will be handled by
              the VitalPilot backend.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordRule({
  met,
  text,
}: {
  met: boolean;
  text: string;
}) {
  return (
    <View style={styles.ruleRow}>
      <View
        style={
          met
            ? styles.ruleIconMet
            : styles.ruleIcon
        }
      >
        <Text
          style={
            met
              ? styles.ruleIconTextMet
              : styles.ruleIconText
          }
        >
          {met ? '✓' : '•'}
        </Text>
      </View>

      <Text
        style={
          met
            ? styles.ruleTextMet
            : styles.ruleText
        }
      >
        {text}
      </Text>
    </View>
  );
}

function BenefitRow({
  icon,
  title,
  text,
  color,
  background,
}: {
  icon: string;
  title: string;
  text: string;
  color: string;
  background: string;
}) {
  return (
    <View style={styles.benefitRow}>
      <View
        style={[
          styles.benefitIcon,
          {
            backgroundColor:
              background,
          },
        ]}
      >
        <Text
          style={[
            styles.benefitIconText,
            {
              color,
            },
          ]}
        >
          {icon}
        </Text>
      </View>

      <View style={styles.benefitContent}>
        <Text style={styles.benefitName}>
          {title}
        </Text>

        <Text style={styles.benefitText}>
          {text}
        </Text>
      </View>
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
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor:
      'rgba(135, 82, 212, 0.05)',
    bottom: -45,
    left: -28,
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
    fontSize: 25,
    fontWeight: '900',
    marginTop: 11,
    textAlign: 'center',
  },

  heroSubtitle: {
    maxWidth: 335,
    color: '#52635B',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },

  progressCard: {
    width: '100%',
    backgroundColor:
      'rgba(255,255,255,0.78)',
    borderRadius: 15,
    padding: 12,
    marginTop: 18,
  },

  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  progressLabel: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  progressStep: {
    color: '#667085',
    fontSize: 9,
    fontWeight: '700',
  },

  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#DCEAE2',
    marginTop: 9,
    overflow: 'hidden',
  },

  progressFill: {
    width: '50%',
    height: '100%',
    borderRadius: 4,
    backgroundColor:
      VitalPilotColors.primary,
  },

  progressText: {
    color: '#667085',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 7,
  },

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

  nameRow: {
    flexDirection: 'row',
    gap: 10,
  },

  nameField: {
    flex: 1,
    gap: 7,
  },

  fieldSection: {
    gap: 7,
  },

  label: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '800',
  },

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

  passwordRequirements: {
    backgroundColor: '#F8FAF9',
    borderRadius: 13,
    padding: 11,
    gap: 6,
  },

  passwordRequirementsTitle: {
    color: '#475467',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 2,
  },

  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ruleIcon: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#EAECF0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  ruleIconMet: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#DDF3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  ruleIconText: {
    color: '#98A2B3',
    fontSize: 10,
  },

  ruleIconTextMet: {
    color: '#137A53',
    fontSize: 9,
    fontWeight: '900',
  },

  ruleText: {
    color: '#667085',
    fontSize: 9,
  },

  ruleTextMet: {
    color: '#137A53',
    fontSize: 9,
    fontWeight: '700',
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    marginTop: 1,
  },

  checkboxSelected: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor:
      VitalPilotColors.primary,
    borderWidth: 1.5,
    borderColor:
      VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    marginTop: 1,
  },

  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  termsText: {
    flex: 1,
    color: '#667085',
    fontSize: 10,
    lineHeight: 16,
  },

  termsLink: {
    color:
      VitalPilotColors.primaryDark,
    fontWeight: '800',
  },

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

  createButton: {
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

  createButtonDisabled: {
    backgroundColor: '#B8DCC8',
  },

  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  createArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

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

  signInLink: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
  },

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

  benefitCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E4',
    borderRadius: 20,
    padding: 16,
    gap: 13,
  },

  benefitTitle: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
  },

  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  benefitIconText: {
    fontSize: 15,
    fontWeight: '900',
  },

  benefitContent: {
    flex: 1,
  },

  benefitName: {
    color: '#344054',
    fontSize: 11,
    fontWeight: '800',
  },

  benefitText: {
    color: '#667085',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

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