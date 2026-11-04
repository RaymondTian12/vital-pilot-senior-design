import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api } from "@/services/api";
import type { AdminAccount } from "@/types/vitalpilot";
import { Button, Card, Empty, Field, Heading, Notice, ui } from "@/components/design/ui";

export function AdminTeam() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setAccounts((await api.adminAccounts("", "admin")).accounts); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load admin accounts."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function create() {
    if (busy) return;
    if (!first.trim() || !last.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter both names and a valid email address."); return;
    }
    if (password.length < 12 || password.length > 128 || password !== confirm) {
      setError("Use matching passwords with 12 to 128 characters."); return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await api.createAdmin({ first_name: first.trim(), last_name: last.trim(), email: email.trim(), password });
      setFirst(""); setLast(""); setEmail(""); setPassword(""); setConfirm("");
      setMessage(`Admin account created for ${result.email}. Share their password privately.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create admin account."); }
    finally { setBusy(false); }
  }
  return <View style={ui.stack}>
    <Heading title="Add admins" subtitle="Create a separate account for each teammate." />
    <Notice>You set the initial password. Share it privately with the new admin. Do not reuse your own admin password.</Notice>
    <Card>
      <Text style={ui.heading}>New admin</Text>
      <Field label="First name" value={first} onChangeText={setFirst} autoComplete="given-name" />
      <Field label="Last name" value={last} onChangeText={setLast} autoComplete="family-name" />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" />
      <Text style={ui.small}>Use 12 to 128 characters.</Text>
      <Button loading={busy} onPress={() => void create()}>Create admin account</Button>
    </Card>
    {!!message && <Notice>{message}</Notice>}
    {!!error && <Notice error>{error}</Notice>}
    <Heading title="Current admins" subtitle="Each account signs in separately." />
    {loading && <Text style={ui.body}>Loading admins…</Text>}
    {!loading && !error && !accounts.length && <Empty title="No admins found" message="Refresh to load admin accounts." />}
    {accounts.map((account) => <Card key={account.user_id}>
      <Text style={ui.heading}>{account.first_name} {account.last_name}</Text>
      <Text style={ui.small}>{account.email}</Text>
    </Card>)}
    <Button secondary onPress={() => void load()}>Refresh admins</Button>
  </View>;
}
