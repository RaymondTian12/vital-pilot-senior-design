import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalButton } from '@/components/vitalpilot/button';
import { VitalPilotColors } from '@/constants/vitalpilot';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [isSuccess, setIsSuccess] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function validatePassword() {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return 'Please complete all password fields.';
    }

    if (newPassword.length < 8) {
      return 'New password must be at least 8 characters.';
    }

    if (
      newPassword === currentPassword
    ) {
      return 'Your new password must be different from your current password.';
    }

    if (
      newPassword !== confirmPassword
    ) {
      return 'New passwords do not match.';
    }

    return '';
  }

  async function handleChangePassword() {
    const validationError =
      validatePassword();

    if (validationError) {
      setMessage(validationError);
      setIsSuccess(false);
      return;
    }

    setMessage('');
    setIsSubmitting(true);

    try {
      /*
       * FRONTEND PROTOTYPE
       *
       * Replace this block with your FastAPI
       * password-change endpoint when the backend
       * is available.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 600)
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setIsSuccess(true);

      setMessage(
        'Password updated successfully.'
      );
    } catch {
      setIsSuccess(false);

      setMessage(
        'Unable to update your password. Please try again.'
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
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ← Back
            </Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>
              Change Password
            </Text>

            <Text style={styles.subtitle}>
              Choose a strong password to help
              protect your VitalPilot account.
            </Text>
          </View>

          <View style={styles.securityCard}>
            <View style={styles.securityIcon}>
              <Text
                style={styles.securityIconText}
              >
                ✓
              </Text>
            </View>

            <View style={styles.securityText}>
              <Text
                style={styles.securityTitle}
              >
                Account Security
              </Text>

              <Text
                style={
                  styles.securityDescription
                }
              >
                Use at least 8 characters and
                avoid reusing your current
                password.
              </Text>
            </View>
          </View>

          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            visible={showCurrentPassword}
            onToggleVisibility={() =>
              setShowCurrentPassword(
                (current) => !current
              )
            }
          />

          <PasswordInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            visible={showNewPassword}
            onToggleVisibility={() =>
              setShowNewPassword(
                (current) => !current
              )
            }
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            visible={showConfirmPassword}
            onToggleVisibility={() =>
              setShowConfirmPassword(
                (current) => !current
              )
            }
          />

          <View style={styles.requirements}>
            <Text
              style={styles.requirementsTitle}
            >
              Password requirements
            </Text>

            <RequirementRow
              text="At least 8 characters"
              valid={newPassword.length >= 8}
            />

            <RequirementRow
              text="Different from current password"
              valid={
                newPassword.length > 0 &&
                newPassword !==
                  currentPassword
              }
            />

            <RequirementRow
              text="Passwords match"
              valid={
                confirmPassword.length > 0 &&
                newPassword ===
                  confirmPassword
              }
            />
          </View>

          {message ? (
            <View
              style={
                isSuccess
                  ? styles.successBox
                  : styles.errorBox
              }
            >
              <Text
                style={
                  isSuccess
                    ? styles.successText
                    : styles.errorText
                }
              >
                {message}
              </Text>
            </View>
          ) : null}

          <VitalButton
            onPress={handleChangePassword}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Updating Password...'
              : 'Update Password'}
          </VitalButton>

          <VitalButton
            variant="secondary"
            onPress={() => router.back()}
          >
            Cancel
          </VitalButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordInput({
  label,
  value,
  onChangeText,
  visible,
  onToggleVisibility,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Enter password"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          accessibilityLabel={label}
        />

        <Pressable
          onPress={onToggleVisibility}
          style={styles.visibilityButton}
        >
          <Text
            style={styles.visibilityText}
          >
            {visible ? 'Hide' : 'Show'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function RequirementRow({
  text,
  valid,
}: {
  text: string;
  valid: boolean;
}) {
  return (
    <View style={styles.requirementRow}>
      <View
        style={
          valid
            ? styles.validDot
            : styles.inactiveDot
        }
      />

      <Text
        style={
          valid
            ? styles.validRequirement
            : styles.requirementText
        }
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 24,
    gap: 18,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
  },

  backText: {
    color:
      VitalPilotColors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },

  header: {
    gap: 6,
  },

  title: {
    color:
      VitalPilotColors.title,
    fontSize: 28,
    fontWeight: '900',
  },

  subtitle: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
  },

  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',

    padding: 14,

    borderRadius: 16,

    backgroundColor: '#EEF8F2',

    gap: 12,
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

    fontWeight: '900',
  },

  securityText: {
    flex: 1,
  },

  securityTitle: {
    color: '#101828',
    fontSize: 13,
    fontWeight: '800',
  },

  securityDescription: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  field: {
    gap: 7,
  },

  label: {
    color: '#344054',
    fontSize: 13,
    fontWeight: '700',
  },

  inputContainer: {
    minHeight: 54,

    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#D0D5DD',

    borderRadius: 14,

    backgroundColor: '#FFFFFF',
  },

  input: {
    flex: 1,
    minHeight: 52,

    paddingHorizontal: 15,

    color: '#101828',

    fontSize: 15,
  },

  visibilityButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  visibilityText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '700',
  },

  requirements: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E2E8E5',

    borderRadius: 16,

    padding: 14,

    gap: 9,
  },

  requirementsTitle: {
    color: '#344054',

    fontSize: 12,
    fontWeight: '800',

    marginBottom: 2,
  },

  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 8,
  },

  inactiveDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#D0D5DD',
  },

  validDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#15945C',
  },

  requirementText: {
    color: '#667085',
    fontSize: 11,
  },

  validRequirement: {
    color: '#137A53',
    fontSize: 11,
    fontWeight: '600',
  },

  errorBox: {
    backgroundColor: '#FFF4ED',

    borderRadius: 12,

    padding: 11,
  },

  errorText: {
    color: '#B54708',

    fontSize: 12,
  },

  successBox: {
    backgroundColor: '#ECF8F2',

    borderRadius: 12,

    padding: 11,
  },

  successText: {
    color: '#137A53',

    fontSize: 12,
    fontWeight: '700',
  },
});