import { useCallback, useEffect, useState } from "react";
import { Alert, Platform, Text } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/services/api";
import { Button, Card, Empty, Heading, Notice, Screen, ui } from "@/components/design/ui";

type Provider = { provider_id: number; first_name: string; last_name: string; specialty: string; status: string };
export default function Sharing() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setError(""); setProviders((await api.myProviders()).providers); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load sharing settings."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function revoke(id: number) {
    setBusy(true);
    try { await api.revokeProvider(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not revoke access."); }
    finally { setBusy(false); }
  }
  function confirmRevoke(provider: Provider) {
    const message = `Dr. ${provider.last_name} will no longer be able to view your readings.`;
    if (Platform.OS === "web") {
      if (window.confirm(message)) void revoke(provider.provider_id);
      return;
    }
    Alert.alert("Remove doctor access?", message, [
      { text: "Cancel", style: "cancel" }, { text: "Remove access", style: "destructive", onPress: () => void revoke(provider.provider_id) },
    ]);
  }
  return <Screen back>
    <Heading title="Doctor access" subtitle="Only doctors you approve can view your saved health readings." />
    <Notice>Removing a doctor stops future access. A doctor may already have seen information while access was active.</Notice>
    {!!error && <Notice error>{error}</Notice>}
    {!providers.length && !error && <Empty title="No doctors have access" message="Open the VitalPilot care directory to choose a registered doctor." />}
    <Button onPress={() => router.push("/care-team")}>Find registered doctors</Button>
    {providers.map((p) => <Card key={p.provider_id}>
      <Text style={ui.heading}>Dr. {p.first_name} {p.last_name}</Text>
      <Text style={ui.body}>{p.specialty}</Text>
      <Button secondary disabled={busy} onPress={() => confirmRevoke(p)}>Remove access</Button>
    </Card>)}
  </Screen>;
}
