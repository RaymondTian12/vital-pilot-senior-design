import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";
import type { AdminProvider } from "@/types/vitalpilot";
import { Button, Card, Empty, Field, Heading, Notice, Screen, ui } from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

function ProviderCard({ provider, onReviewed }: { provider: AdminProvider; onReviewed: (decision: "APPROVED" | "REJECTED") => Promise<void> }) {
  const [note, setNote] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(decision: "APPROVED" | "REJECTED") {
    if (busy) return;
    if (note.trim().length < 3) { setError("Enter a review note before deciding."); return; }
    if (decision === "APPROVED" && !verified) { setError("Confirm identity and active license verification before approval."); return; }
    setBusy(true); setError("");
    try {
      await api.reviewProvider(provider.provider_id, decision, note.trim(), verified);
      await onReviewed(decision);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to review this application."); }
    finally { setBusy(false); }
  }
  return <Card>
    <Text style={ui.heading}>{provider.first_name} {provider.last_name}</Text>
    <Text style={ui.small}>{provider.email}</Text>
    <Text style={ui.body}>NPI: {provider.npi}</Text>
    <Text style={ui.body}>Specialty: {provider.specialty}</Text>
    <Text style={ui.body}>License: {provider.license_state} {provider.license_number}</Text>
    {provider.verification_status === "PENDING" ? <>
      <Notice>Check the NPI Registry, identity, and active state license before approving. An NPI match alone does not verify a license.</Notice>
      <Button secondary onPress={() => void Linking.openURL("https://npiregistry.cms.hhs.gov/")}>Open NPI Registry</Button>
      <Field label="Review note" value={note} onChangeText={setNote} multiline placeholder="Record what you checked or why you rejected this application" />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: verified }} onPress={() => setVerified(!verified)} style={[ui.row, { minHeight: 48 }]}>
        <Text style={ui.body}>{verified ? "☑" : "☐"} I verified identity and active license</Text>
      </Pressable>
      {!!error && <Notice error>{error}</Notice>}
      <Button loading={busy} onPress={() => void decide("APPROVED")}>Approve doctor</Button>
      <Button secondary disabled={busy} onPress={() => void decide("REJECTED")}>Reject application</Button>
    </> : <Text style={ui.small}>Status: {provider.verification_status === "APPROVED" ? "Approved" : "Rejected"}</Text>}
  </Card>;
}

export default function AdminPortal() {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<ReviewStatus>("PENDING");
  const [offset, setOffset] = useState(0);
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setProviders((await api.adminProviders(status, offset)).providers); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load doctor applications."); }
    finally { setLoading(false); }
  }, [status, offset]);
  useEffect(() => { void load(); }, [load]);
  function showStatus(next: ReviewStatus) { setStatus(next); setOffset(0); setMessage(""); }
  async function reviewed(decision: "APPROVED" | "REJECTED") {
    setMessage(decision === "APPROVED" ? "Doctor approved. They can now receive patient sharing requests." : "Application rejected.");
    await load();
  }
  return <Screen brand={false}>
    <Heading title="Admin portal" subtitle={`Welcome, ${user?.firstname ?? ""}`} />
    <Notice>Review doctor applications before they can receive patient access.</Notice>
    <View style={[ui.row, { gap: 8 }]}>
      {(["PENDING", "APPROVED", "REJECTED"] as const).map((option) =>
        <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: status === option }}
          onPress={() => showStatus(option)} style={{ flex: 1, minHeight: 48, borderRadius: 12,
            backgroundColor: status === option ? C.primary : C.white, borderColor: C.border, borderWidth: 1,
            alignItems: "center", justifyContent: "center" }}>
          <Text style={[ui.small, { fontWeight: "700", color: status === option ? C.white : C.primaryDark }]}>{option === "PENDING" ? "Pending" : option === "APPROVED" ? "Approved" : "Rejected"}</Text>
        </Pressable>)}
    </View>
    {!!message && <Notice>{message}</Notice>}
    {!!error && <Notice error>{error}</Notice>}
    {loading ? <Text style={ui.body}>Loading applications…</Text> : !error && !providers.length ? <Empty title="No applications" message={`No ${status.toLowerCase()} doctor applications found.`} /> : null}
    {providers.map((provider) => <ProviderCard key={provider.provider_id} provider={provider} onReviewed={reviewed} />)}
    <View style={[ui.row, { justifyContent: "space-between" }]}>
      <Button secondary disabled={offset === 0 || loading} onPress={() => setOffset(Math.max(0, offset - 50))}>Previous</Button>
      <Button secondary disabled={providers.length < 50 || loading} onPress={() => setOffset(offset + 50)}>Next</Button>
    </View>
    <Button secondary onPress={() => void load()}>Refresh</Button>
    <Button secondary onPress={() => void signOut()}>Sign out</Button>
  </Screen>;
}
