import { useState } from "react";
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { Button, Field, Heading, Notice, Screen, ui } from "@/components/design/ui";
import { US_STATES } from "@/constants/us-states";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

export default function DoctorSignUp() {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [npi, setNpi] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [state, setState] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [stateOpen, setStateOpen] = useState(false);
  const [license, setLicense] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const search = state ? "" : stateQuery.trim().toLowerCase();
  const matchingStates = US_STATES.filter(([code, name]) => !search || name.toLowerCase().startsWith(search) || code.toLowerCase().startsWith(search));
  async function submit() {
    if (busy) return;
    const validation = [
      ["first", !!first.trim(), "Enter your first name."],
      ["last", !!last.trim(), "Enter your last name."],
      ["email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), "Enter a valid email address."],
      ["npi", /^\d{10}$/.test(npi.trim()), "NPI must be exactly 10 digits, with no letters."],
      ["specialty", !!specialty.trim(), "Enter your specialty."],
      ["state", US_STATES.some(([code]) => code === state), "Select a license state from the list."],
      ["license", !!license.trim(), "Enter your license number."],
      ["password", password.length >= 12, "Password must be at least 12 characters."],
      ["confirm", password === confirm, "Confirm password must match your password."],
    ] as const;
    const invalid = validation.find(([, valid]) => !valid);
    if (invalid) {
      setInvalidField(invalid[0]);
      setError(invalid[2]);
      return;
    }
    setBusy(true); setError(""); setInvalidField("");
    try {
      await api.registerDoctor({
        firstname: first.trim(), lastname: last.trim(), email: email.trim(), password,
        npi: npi.trim(), specialty: specialty.trim(), license_state: state, license_number: license.trim(),
      });
      router.replace("/doctor-signup-success");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit your registration."); }
    finally { setBusy(false); }
  }
  return <Screen back backFallback="/welcome">
    <Heading title="Register as a doctor" subtitle="Create an account and submit your professional details for verification." />
    <Notice>Your patient list will become available after your account is approved and a patient shares their records with you.</Notice>
    <View style={{ gap: 14 }}>
      <Field label="First name" value={first} onChangeText={setFirst} error={invalidField === "first" ? error : undefined} autoComplete="given-name" />
      <Field label="Last name" value={last} onChangeText={setLast} error={invalidField === "last" ? error : undefined} autoComplete="family-name" />
      <Field label="Email" value={email} onChangeText={setEmail} error={invalidField === "email" ? error : undefined} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="NPI" value={npi} onChangeText={setNpi} error={invalidField === "npi" ? error : undefined} keyboardType="number-pad" maxLength={10} />
      <Field label="Specialty" value={specialty} onChangeText={setSpecialty} error={invalidField === "specialty" ? error : undefined} />
      <View style={{ gap: 8 }}>
        <Text style={[ui.body, { fontWeight: "600" }]}>License state</Text>
        <View style={ui.row}>
          <TextInput
            accessibilityLabel="License state"
            accessibilityHint="Type the first letters of a state, then select it from the list"
            placeholder="Search 50 states"
            placeholderTextColor="#6B8191"
            autoCapitalize="words"
            autoCorrect={false}
            value={stateQuery}
            onFocus={() => setStateOpen(true)}
            onChangeText={(value) => { setStateQuery(value); setState(""); setStateOpen(true); }}
            style={[ui.input, invalidField === "state" ? { borderColor: C.danger } : null]}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Show license states" onPress={() => setStateOpen(!stateOpen)} style={{ minWidth: 48, minHeight: 48, alignItems: "center", justifyContent: "center" }}>
            <Text style={ui.link}>{stateOpen ? "▲" : "▼"}</Text>
          </Pressable>
        </View>
        {stateOpen && <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always" style={{ maxHeight: 220, borderWidth: 1, borderColor: C.border, borderRadius: 14, backgroundColor: C.white }}>
          {matchingStates.map(([code, name]) =>
            <Pressable key={code} accessibilityRole="button" accessibilityLabel={`${name}, ${code}`} onPress={() => { setState(code); setStateQuery(`${name} (${code})`); setStateOpen(false); Keyboard.dismiss(); }} style={{ minHeight: 48, justifyContent: "center", paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={ui.body}>{name} ({code})</Text>
            </Pressable>)}
          {!matchingStates.length && <Text style={[ui.small, { padding: 15 }]}>No matching state</Text>}
        </ScrollView>}
      </View>
      <Field label="License number" value={license} onChangeText={setLicense} error={invalidField === "license" ? error : undefined} />
      <Field label="Password" value={password} onChangeText={setPassword} error={invalidField === "password" ? error : undefined} secureTextEntry autoComplete="new-password" />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} error={invalidField === "confirm" ? error : undefined} secureTextEntry autoComplete="new-password" />
    </View>
    <Text style={ui.small}>Use at least 12 characters for your password.</Text>
    {!!error && <Notice error>{error}</Notice>}
    <Button loading={busy} onPress={submit}>Submit for verification</Button>
  </Screen>;
}
