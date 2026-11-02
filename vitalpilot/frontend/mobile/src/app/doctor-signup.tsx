import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { Button, Field, Heading, Notice, Screen, ui } from "@/components/design/ui";

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
  const [license, setLicense] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (busy) return;
    if (!first.trim() || !last.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        password.length < 12 || password !== confirm || !/^\d{10}$/.test(npi.trim()) ||
        !specialty.trim() || !/^[A-Za-z]{2}$/.test(state.trim()) || !license.trim()) {
      setError("Complete every field. Use a 10-digit NPI, a two-letter license state, and a matching password of at least 12 characters.");
      return;
    }
    setBusy(true); setError("");
    try {
      await api.registerDoctor({
        firstname: first.trim(), lastname: last.trim(), email: email.trim(), password,
        npi: npi.trim(), specialty: specialty.trim(), license_state: state.trim().toUpperCase(), license_number: license.trim(),
      });
      router.replace("/signin?registered=doctor");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to submit your registration."); }
    finally { setBusy(false); }
  }
  return <Screen back backFallback="/welcome">
    <Heading title="Register as a doctor" subtitle="Create an account and submit your professional details for verification." />
    <Notice>Your patient list will become available after your account is approved and a patient shares their records with you.</Notice>
    <View style={{ gap: 14 }}>
      <Field label="First name" value={first} onChangeText={setFirst} autoComplete="given-name" />
      <Field label="Last name" value={last} onChangeText={setLast} autoComplete="family-name" />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="NPI" value={npi} onChangeText={setNpi} keyboardType="number-pad" maxLength={10} />
      <Field label="Specialty" value={specialty} onChangeText={setSpecialty} />
      <Field label="License state" value={state} onChangeText={setState} autoCapitalize="characters" maxLength={2} />
      <Field label="License number" value={license} onChangeText={setLicense} />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
    </View>
    <Text style={ui.small}>Use at least 12 characters for your password.</Text>
    {!!error && <Notice error>{error}</Notice>}
    <Button loading={busy} onPress={submit}>Submit for verification</Button>
  </Screen>;
}
