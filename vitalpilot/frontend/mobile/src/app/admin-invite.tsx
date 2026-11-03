import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { Button, Field, Heading, Notice, Screen } from "@/components/design/ui";

export default function AdminInvite() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid email address."); return; }
    if (code.trim().length < 20) { setError("Enter the invitation code you received."); return; }
    if (password.length < 12 || password !== confirm) { setError("Use matching passwords with at least 12 characters."); return; }
    setBusy(true); setError("");
    try {
      await api.acceptAdminInvite(email.trim(), code.trim(), password);
      router.replace("/signin?portal=admin&registered=admin");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create admin account."); }
    finally { setBusy(false); }
  }
  return <Screen back backFallback="/welcome">
    <Heading title="Set up your admin account" subtitle="Use the email and one-time invitation code shared by your VitalPilot admin." />
    <Notice>Choose your own password. Your invitation expires after 48 hours and can be used once.</Notice>
    <View style={{ gap: 14 }}>
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="Invitation code" value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
    </View>
    {!!error && <Notice error>{error}</Notice>}
    <Button loading={busy} onPress={() => void submit()}>Create admin account</Button>
  </Screen>;
}
