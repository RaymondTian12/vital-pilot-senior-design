import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VitalButton } from '@/components/vitalpilot/button';
import { VitalCard } from '@/components/vitalpilot/card';
import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';

type UnitSystem = 'metric' | 'us';

const selectedMetrics = [
  'Blood Pressure',
  'Blood Glucose',
  'Blood Oxygen',
  'Weight',
];

export default function ProfileScreen() {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('patient@example.com');
  const [phone, setPhone] = useState('(817) 555-0123');
  const [dateOfBirth, setDateOfBirth] = useState('01/15/1998');

  const [emergencyName, setEmergencyName] = useState('Jane Doe');
  const [emergencyRelationship, setEmergencyRelationship] =
    useState('Family');
  const [emergencyPhone, setEmergencyPhone] =
    useState('(817) 555-0198');

  const [unitSystem, setUnitSystem] =
    useState<UnitSystem>('metric');

  const [criticalAlerts, setCriticalAlerts] =
    useState(true);

  const [loggingReminders, setLoggingReminders] =
    useState(true);

  const [weeklySummaries, setWeeklySummaries] =
    useState(true);

  const [
    milestoneNotifications,
    setMilestoneNotifications,
  ] = useState(false);

  const [message, setMessage] = useState('');

  function saveProfile() {
    if (!name.trim()) {
      setMessage('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    if (!phone.trim()) {
      setMessage('Please enter your phone number.');
      return;
    }

    setMessage('Profile updated successfully.');
    setIsEditing(false);
  }

  function cancelEditing() {
    setMessage('');
    setIsEditing(false);
  }

  function handleLogout() {
    router.replace('/welcome');
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Patient Information
            </Text>

            <Text style={styles.patientName}>
              {name}
            </Text>

            <Text style={styles.patientEmail}>
              {email}
            </Text>
          </View>
        </View>

        {message ? (
          <View
            style={
              message.includes('successfully')
                ? styles.successBox
                : styles.errorBox
            }
          >
            <Text
              style={
                message.includes('successfully')
                  ? styles.successText
                  : styles.errorText
              }
            >
              {message}
            </Text>
          </View>
        ) : null}

        <VitalCard>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>
                Personal Information
              </Text>

              <Text style={styles.cardSubtitle}>
                Manage your basic account information.
              </Text>
            </View>

            {!isEditing ? (
              <Pressable
                onPress={() => {
                  setMessage('');
                  setIsEditing(true);
                }}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>
                  Edit
                </Text>
              </Pressable>
            ) : null}
          </View>

          {isEditing ? (
            <View style={styles.form}>
              <ProfileInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Full name"
              />

              <ProfileInput
                label="Date of Birth"
                value={dateOfBirth}
                onChangeText={setDateOfBirth}
                placeholder="MM/DD/YYYY"
              />

              <ProfileInput
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />

              <ProfileInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <VitalButton onPress={saveProfile}>
                Save Changes
              </VitalButton>

              <VitalButton
                variant="secondary"
                onPress={cancelEditing}
              >
                Cancel
              </VitalButton>
            </View>
          ) : (
            <View style={styles.infoList}>
              <InformationRow
                label="Full Name"
                value={name}
              />

              <InformationRow
                label="Date of Birth"
                value={dateOfBirth}
              />

              <InformationRow
                label="Phone"
                value={phone}
              />

              <InformationRow
                label="Email"
                value={email}
              />
            </View>
          )}
        </VitalCard>

        <VitalCard>
          <Text style={styles.cardTitle}>
            Health Profile
          </Text>

          <Text style={styles.cardSubtitle}>
            Metrics currently selected for monitoring.
          </Text>

          <View style={styles.metricGrid}>
            {selectedMetrics.map((metric) => (
              <View
                key={metric}
                style={styles.metricChip}
              >
                <View style={styles.metricDot} />

                <Text style={styles.metricChipText}>
                  {metric}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => router.push('/metrics')}
            style={styles.rowAction}
          >
            <Text style={styles.rowActionText}>
              Manage Health Metrics
            </Text>

            <Text style={styles.chevron}>
              ›
            </Text>
          </Pressable>
        </VitalCard>

        <VitalCard>
          <Text style={styles.cardTitle}>
            Measurement Units
          </Text>

          <Text style={styles.cardSubtitle}>
            Choose how measurements are displayed and entered.
          </Text>

          <View style={styles.unitSelector}>
            <Pressable
              onPress={() => setUnitSystem('metric')}
              style={
                unitSystem === 'metric'
                  ? styles.unitButtonSelected
                  : styles.unitButton
              }
            >
              <Text
                style={
                  unitSystem === 'metric'
                    ? styles.unitTextSelected
                    : styles.unitText
                }
              >
                Metric
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setUnitSystem('us')}
              style={
                unitSystem === 'us'
                  ? styles.unitButtonSelected
                  : styles.unitButton
              }
            >
              <Text
                style={
                  unitSystem === 'us'
                    ? styles.unitTextSelected
                    : styles.unitText
                }
              >
                U.S.
              </Text>
            </Pressable>
          </View>

          <View style={styles.unitPreview}>
            <UnitRow
              label="Weight"
              value={
                unitSystem === 'metric'
                  ? 'kg'
                  : 'lb'
              }
            />

            <UnitRow
              label="Water"
              value={
                unitSystem === 'metric'
                  ? 'mL'
                  : 'oz'
              }
            />

            <UnitRow
              label="Temperature"
              value={
                unitSystem === 'metric'
                  ? '°C'
                  : '°F'
              }
            />

            <UnitRow
              label="Height"
              value={
                unitSystem === 'metric'
                  ? 'cm'
                  : 'ft / in'
              }
            />
          </View>
        </VitalCard>

        <VitalCard>
          <Text style={styles.cardTitle}>
            Emergency Contact
          </Text>

          <Text style={styles.cardSubtitle}>
            Keep an emergency contact available in your patient profile.
          </Text>

          <ProfileInput
            label="Contact Name"
            value={emergencyName}
            onChangeText={setEmergencyName}
            placeholder="Emergency contact name"
          />

          <ProfileInput
            label="Relationship"
            value={emergencyRelationship}
            onChangeText={setEmergencyRelationship}
            placeholder="Relationship"
          />

          <ProfileInput
            label="Phone Number"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
        </VitalCard>

        <VitalCard>
          <Text style={styles.cardTitle}>
            Notifications
          </Text>

          <Text style={styles.cardSubtitle}>
            Choose which VitalPilot notifications you want to receive.
          </Text>

          <SettingRow
            title="Critical health alerts"
            description="Receive important alerts related to abnormal health measurements."
            value={criticalAlerts}
            onValueChange={setCriticalAlerts}
          />

          <View style={styles.divider} />

          <SettingRow
            title="Logging reminders"
            description="Receive reminders to record your health information."
            value={loggingReminders}
            onValueChange={setLoggingReminders}
          />

          <View style={styles.divider} />

          <SettingRow
            title="Weekly health summaries"
            description="Receive a weekly summary of recent health measurements and trends."
            value={weeklySummaries}
            onValueChange={setWeeklySummaries}
          />

          <View style={styles.divider} />

          <SettingRow
            title="Milestone notifications"
            description="Receive notifications when health goals or milestones are reached."
            value={milestoneNotifications}
            onValueChange={setMilestoneNotifications}
          />
        </VitalCard>

        <VitalCard>
          <Text style={styles.cardTitle}>
            Privacy & Sharing
          </Text>

          <Text style={styles.cardSubtitle}>
            Control which healthcare providers can access your shared health information.
          </Text>

          <View style={styles.privacyStatus}>
            <View style={styles.privacyIcon}>
              <Text style={styles.privacyIconText}>
                ✓
              </Text>
            </View>

            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>
                Patient-controlled sharing
              </Text>

              <Text style={styles.privacyDescription}>
                Providers do not automatically receive access to your health information.
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/doctors')}
            style={styles.rowAction}
          >
            <View style={styles.rowActionMain}>
              <Text style={styles.rowActionText}>
                Manage Provider Access
              </Text>

              <Text style={styles.rowActionSubtext}>
                Review providers with access to your information.
              </Text>
            </View>

            <Text style={styles.chevron}>
              ›
            </Text>
          </Pressable>
        </VitalCard>

        <VitalCard>
          <Text style={styles.cardTitle}>
            Account
          </Text>

          <Pressable
            onPress={() =>
              router.push('/change-password')
            }
            style={styles.accountRow}
          >
            <View style={styles.accountMain}>
              <Text style={styles.accountTitle}>
                Change Password
              </Text>

              <Text style={styles.accountDescription}>
                Update your account password.
              </Text>
            </View>

            <Text style={styles.chevron}>
              ›
            </Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            onPress={handleLogout}
            style={styles.accountRow}
          >
            <View style={styles.accountMain}>
              <Text style={styles.logoutTitle}>
                Sign Out
              </Text>

              <Text style={styles.accountDescription}>
                Sign out of your VitalPilot account.
              </Text>
            </View>

            <Text style={styles.chevron}>
              ›
            </Text>
          </Pressable>
        </VitalCard>

        <View style={styles.versionSection}>
          <Text style={styles.versionText}>
            VitalPilot
          </Text>

          <Text style={styles.versionNumber}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad';
  autoCapitalize?:
    | 'none'
    | 'sentences'
    | 'words';
}) {
  return (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={styles.input}
        accessibilityLabel={label}
      />
    </View>
  );
}

function InformationRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.informationRow}>
      <Text style={styles.informationLabel}>
        {label}
      </Text>

      <Text style={styles.informationValue}>
        {value}
      </Text>
    </View>
  );
}

function UnitRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.unitRow}>
      <Text style={styles.unitRowLabel}>
        {label}
      </Text>

      <Text style={styles.unitRowValue}>
        {value}
      </Text>
    </View>
  );
}

function SettingRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text style={styles.settingDescription}>
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: '#D0D5DD',
          true: '#B8E6D1',
        }}
        thumbColor={
          value
            ? VitalPilotColors.primary
            : '#F2F4F7'
        }
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },

  content: {
    padding: 20,
    paddingBottom: BottomTabInset + 40,
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,

    backgroundColor: '#E4F5EC',

    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: VitalPilotColors.primaryDark,

    fontSize: 21,
    fontWeight: '900',
  },

  headerText: {
    flex: 1,
  },

  title: {
    color: VitalPilotColors.title,

    fontSize: 26,
    fontWeight: '900',
  },

  patientName: {
    color: '#344054',

    fontSize: 15,
    fontWeight: '700',

    marginTop: 4,
  },

  patientEmail: {
    color: '#667085',

    fontSize: 12,

    marginTop: 2,
  },

  cardHeader: {
    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'flex-start',

    gap: 12,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardTitle: {
    color: VitalPilotColors.title,

    fontSize: 18,
    fontWeight: '800',
  },

  cardSubtitle: {
    color: '#667085',

    fontSize: 12,
    lineHeight: 18,

    marginTop: 4,
  },

  editButton: {
    minWidth: 60,

    paddingHorizontal: 12,
    paddingVertical: 7,

    borderRadius: 10,

    backgroundColor: '#ECF8F2',

    alignItems: 'center',
  },

  editButtonText: {
    color: VitalPilotColors.primaryDark,

    fontSize: 12,
    fontWeight: '800',
  },

  form: {
    gap: 12,

    marginTop: 8,
  },

  infoList: {
    marginTop: 5,
  },

  informationRow: {
    minHeight: 52,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    gap: 14,

    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },

  informationLabel: {
    color: '#667085',

    fontSize: 13,
  },

  informationValue: {
    flex: 1,

    color: '#101828',

    fontSize: 13,
    fontWeight: '700',

    textAlign: 'right',
  },

  inputSection: {
    gap: 6,
  },

  inputLabel: {
    color: '#344054',

    fontSize: 12,
    fontWeight: '700',
  },

  input: {
    minHeight: 52,

    borderWidth: 1,
    borderColor: '#D0D5DD',

    borderRadius: 14,

    paddingHorizontal: 14,

    backgroundColor: '#FFFFFF',

    color: '#101828',

    fontSize: 14,
  },

  metricGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 8,

    marginTop: 6,
  },

  metricChip: {
    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F5F9F7',

    borderWidth: 1,
    borderColor: '#DFE8E3',

    borderRadius: 18,

    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  metricDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor:
      VitalPilotColors.primary,

    marginRight: 7,
  },

  metricChipText: {
    color: '#475467',

    fontSize: 12,
    fontWeight: '600',
  },

  unitSelector: {
    flexDirection: 'row',

    gap: 8,

    marginTop: 8,
  },

  unitButton: {
    flex: 1,

    minHeight: 44,

    borderWidth: 1,
    borderColor: '#D0D5DD',

    borderRadius: 12,

    backgroundColor: '#FFFFFF',

    alignItems: 'center',
    justifyContent: 'center',
  },

  unitButtonSelected: {
    flex: 1,

    minHeight: 44,

    borderWidth: 1,
    borderColor:
      VitalPilotColors.primary,

    borderRadius: 12,

    backgroundColor: '#ECF8F2',

    alignItems: 'center',
    justifyContent: 'center',
  },

  unitText: {
    color: '#667085',

    fontSize: 13,
    fontWeight: '600',
  },

  unitTextSelected: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 13,
    fontWeight: '800',
  },

  unitPreview: {
    marginTop: 8,
  },

  unitRow: {
    minHeight: 42,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F0',
  },

  unitRowLabel: {
    color: '#667085',

    fontSize: 13,
  },

  unitRowValue: {
    color: '#101828',

    fontSize: 13,
    fontWeight: '800',
  },

  settingRow: {
    minHeight: 74,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 14,
  },

  settingText: {
    flex: 1,
  },

  settingTitle: {
    color: '#344054',

    fontSize: 13,
    fontWeight: '700',
  },

  settingDescription: {
    color: '#667085',

    fontSize: 11,
    lineHeight: 17,

    marginTop: 3,
  },

  divider: {
    height: 1,

    backgroundColor: '#EEF2F0',
  },

  privacyStatus: {
    marginTop: 4,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#F5FAF7',

    borderRadius: 14,

    padding: 12,

    gap: 12,
  },

  privacyIcon: {
    width: 38,
    height: 38,

    borderRadius: 19,

    borderWidth: 2,
    borderColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',
  },

  privacyIconText: {
    color:
      VitalPilotColors.primaryDark,

    fontWeight: '900',
  },

  privacyText: {
    flex: 1,
  },

  privacyTitle: {
    color: '#101828',

    fontSize: 12,
    fontWeight: '800',
  },

  privacyDescription: {
    color: '#667085',

    fontSize: 11,
    lineHeight: 16,

    marginTop: 3,
  },

  rowAction: {
    minHeight: 52,

    marginTop: 7,

    flexDirection: 'row',

    alignItems: 'center',
    justifyContent: 'space-between',

    gap: 12,
  },

  rowActionMain: {
    flex: 1,
  },

  rowActionText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 13,
    fontWeight: '800',
  },

  rowActionSubtext: {
    color: '#667085',

    fontSize: 11,

    marginTop: 3,
  },

  chevron: {
    color: '#98A2B3',

    fontSize: 23,
  },

  accountRow: {
    minHeight: 58,

    flexDirection: 'row',

    justifyContent: 'space-between',
    alignItems: 'center',

    gap: 14,
  },

  accountMain: {
    flex: 1,
  },

  accountTitle: {
    color: '#344054',

    fontSize: 13,
    fontWeight: '700',
  },

  logoutTitle: {
    color: '#D92D20',

    fontSize: 13,
    fontWeight: '800',
  },

  accountDescription: {
    color: '#667085',

    fontSize: 11,

    marginTop: 3,
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

  errorBox: {
    backgroundColor: '#FFF4ED',

    borderRadius: 12,

    padding: 11,
  },

  errorText: {
    color: '#B54708',

    fontSize: 12,
  },

  versionSection: {
    alignItems: 'center',

    paddingVertical: 14,
  },

  versionText: {
    color: '#667085',

    fontSize: 12,
    fontWeight: '700',
  },

  versionNumber: {
    color: '#98A2B3',

    fontSize: 10,

    marginTop: 3,
  },
});