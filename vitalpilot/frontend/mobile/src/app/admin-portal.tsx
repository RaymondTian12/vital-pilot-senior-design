import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";
import type { AdminAccount, AdminProvider } from "@/types/vitalpilot";
import { Button, Card, Empty, Field, Heading, Notice, Screen, ui } from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { defaultWelcomeSlides, mergeWelcomeSlides, type WelcomeSlide } from "@/constants/welcome-slides";
import { AdminTeam } from "@/components/admin/admin-team";

type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "REMOVED";

function AccountCard({ account, onChanged }: { account: AdminAccount; onChanged: () => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function change() {
    if (reason.trim().length < 3) { setError("Enter a reason of at least 3 characters."); return; }
    setBusy(true); setError("");
    try { await api.changeAccountStatus(account.user_id, !account.is_active, reason.trim()); await onChanged(); setReason(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to change account status."); }
    finally { setBusy(false); }
  }
  return <Card>
    <Text style={ui.heading}>{account.first_name} {account.last_name}</Text>
    <Text style={ui.small}>{account.email}</Text>
    <Text style={ui.body}>{account.role === "provider" ? "Doctor" : account.role === "patient" ? "Patient" : "Admin"} · {account.is_active ? "Active" : "Suspended"}</Text>
    {account.role !== "admin" && <>
      <Field label="Reason" value={reason} onChangeText={setReason} maxLength={500} placeholder={account.is_active ? "Why are you suspending this account?" : "Why are you restoring this account?"} />
      {!!error && <Notice error>{error}</Notice>}
      <Button secondary loading={busy} onPress={() => void change()}>{account.is_active ? "Suspend account" : "Restore account"}</Button>
    </>}
  </Card>;
}

function Accounts() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | "patient" | "provider" | "admin">("");
  const [offset, setOffset] = useState(0);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setAccounts((await api.adminAccounts(search, role, offset)).accounts); }
    catch (e) { setAccounts([]); setError(e instanceof Error ? e.message : "Unable to load accounts."); }
    finally { setLoading(false); }
  }, [search, role, offset]);
  useEffect(() => { void load(); }, [load]);
  return <View style={ui.stack}>
    <Heading title="Accounts" subtitle="Find patients and doctors, and manage account access." />
    <Field label="Search by name or email" value={searchInput} onChangeText={setSearchInput} autoCapitalize="none" />
    <Button secondary onPress={() => { setOffset(0); setSearch(searchInput.trim()); }}>Search accounts</Button>
    <View style={[ui.row, { flexWrap: "wrap" }]}>
      {(["", "patient", "provider", "admin"] as const).map((option) => <Pressable key={option || "all"} accessibilityRole="button" accessibilityState={{ selected: role === option }} onPress={() => { setRole(option); setOffset(0); }}>
        <Text style={[ui.link, { padding: 8, color: role === option ? C.primaryDark : C.textSecondary }]}>{option === "" ? "All" : option === "provider" ? "Doctors" : option === "patient" ? "Patients" : "Admins"}</Text>
      </Pressable>)}
    </View>
    {!!error && <Notice error>{error}</Notice>}
    {loading ? <Text style={ui.body}>Loading accounts…</Text> : !error && !accounts.length ? <Empty title="No accounts" message="No accounts match your search." /> : null}
    {accounts.map((account) => <AccountCard key={account.user_id} account={account} onChanged={load} />)}
    <View style={[ui.row, { justifyContent: "space-between" }]}>
      <Button secondary disabled={offset === 0 || loading} onPress={() => setOffset(Math.max(0, offset - 50))}>Previous</Button>
      <Button secondary disabled={accounts.length < 50 || loading} onPress={() => setOffset(offset + 50)}>Next</Button>
    </View>
    <Button secondary onPress={() => void load()}>Refresh accounts</Button>
  </View>;
}

function WelcomeEditor() {
  const [slides, setSlides] = useState<WelcomeSlide[]>(defaultWelcomeSlides);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    api.welcomeSlides().then(({ slides: overrides }) => {
      if (active) setSlides(mergeWelcomeSlides(overrides));
    }).catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load welcome text."); });
    return () => { active = false; };
  }, []);
  function update(number: number, field: "eyebrow" | "title" | "description", value: string) {
    setSlides((current) => current.map((slide) => slide.slide_number === number ? { ...slide, [field]: value } : slide));
    setMessage("");
  }
  async function save(slide: WelcomeSlide) {
    if (!slide.eyebrow.trim() || !slide.title.trim() || !slide.description.trim()) {
      setError("Fill in all fields before saving."); return;
    }
    setBusy(slide.slide_number); setError(""); setMessage("");
    try {
      await api.updateWelcomeSlide(slide);
      setMessage(`Welcome page ${slide.slide_number} saved.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save welcome text."); }
    finally { setBusy(null); }
  }
  return <View style={ui.stack}>
    <Heading title="Welcome page" subtitle="Edit the four panels people see before signing in." />
    {!!error && <Notice error>{error}</Notice>}
    {!!message && <Notice>{message}</Notice>}
    {slides.map((slide) => <Card key={slide.slide_number}>
      <Text style={ui.heading}>Page {slide.slide_number}</Text>
      <Field label="Small heading" value={slide.eyebrow} onChangeText={(value) => update(slide.slide_number, "eyebrow", value)} maxLength={80} />
      <Field label="Title" value={slide.title} onChangeText={(value) => update(slide.slide_number, "title", value)} maxLength={160} multiline />
      <Field label="Description" value={slide.description} onChangeText={(value) => update(slide.slide_number, "description", value)} maxLength={500} multiline />
      <Button loading={busy === slide.slide_number} disabled={busy !== null && busy !== slide.slide_number} onPress={() => void save(slide)}>Save page {slide.slide_number}</Button>
    </Card>)}
  </View>;
}

function ProviderCard({ provider, onReviewed }: { provider: AdminProvider; onReviewed: (decision: "APPROVED" | "REJECTED" | "REMOVED") => Promise<void> }) {
  const [note, setNote] = useState("");
  const [verified, setVerified] = useState(false);
  const [confirmedRemoval, setConfirmedRemoval] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function decide(decision: "APPROVED" | "REJECTED" | "REMOVED") {
    if (busy) return;
    if (note.trim().length < 3) { setError("Enter a review note before deciding."); return; }
    if (decision === "APPROVED" && !verified) { setError("Confirm identity and active license verification before approval."); return; }
    if (decision === "REMOVED" && !confirmedRemoval) { setError("Confirm that existing patient sharing will be revoked."); return; }
    setBusy(true); setError("");
    try {
      await api.reviewProvider(provider.provider_id, decision, note.trim(), verified, confirmedRemoval);
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
    <Text style={ui.small}>Status: {provider.verification_status === "APPROVED" ? "Approved" : provider.verification_status === "REJECTED" ? "Rejected" : provider.verification_status === "REMOVED" ? "Removed" : "Pending"}</Text>
    {provider.verification_status === "APPROVED" ? <>
      <Notice>Removing this doctor blocks patient record access and revokes every existing patient grant. Patients must share again if the doctor is reapproved.</Notice>
      <Field label="Removal reason" value={note} onChangeText={setNote} multiline placeholder="Explain why this doctor is being removed" />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: confirmedRemoval }} onPress={() => setConfirmedRemoval(!confirmedRemoval)} style={[ui.row, { minHeight: 48 }]}>
        <Text style={ui.body}>{confirmedRemoval ? "☑" : "☐"} I understand existing patient sharing will be revoked</Text>
      </Pressable>
      {!!error && <Notice error>{error}</Notice>}
      <Button secondary loading={busy} onPress={() => void decide("REMOVED")}>Remove doctor</Button>
    </> : <>
      <Notice>Check the NPI Registry, identity, and active state license before approving. An NPI match alone does not verify a license.</Notice>
      <Button secondary onPress={() => void Linking.openURL("https://npiregistry.cms.hhs.gov/")}>Open NPI Registry</Button>
      <Field label="Review note" value={note} onChangeText={setNote} multiline placeholder="Record what you checked or why you made this decision" />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: verified }} onPress={() => setVerified(!verified)} style={[ui.row, { minHeight: 48 }]}>
        <Text style={ui.body}>{verified ? "☑" : "☐"} I verified identity and active license</Text>
      </Pressable>
      {!!error && <Notice error>{error}</Notice>}
      <Button loading={busy} onPress={() => void decide("APPROVED")}>{provider.verification_status === "PENDING" ? "Approve doctor" : "Approve again"}</Button>
      {provider.verification_status === "PENDING" && <Button secondary disabled={busy} onPress={() => void decide("REJECTED")}>Reject application</Button>}
      {provider.verification_status === "REMOVED" && <Notice>Previous patient sharing remains revoked after reapproval.</Notice>}
    </>}
  </Card>;
}

export default function AdminPortal() {
  const { user, signOut } = useAuth();
  const [section, setSection] = useState<"doctors" | "accounts" | "content" | "team">("doctors");
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
  async function reviewed(decision: "APPROVED" | "REJECTED" | "REMOVED") {
    setMessage(decision === "APPROVED" ? "Doctor approved. They can now receive new patient sharing requests." : decision === "REMOVED" ? "Doctor removed. Existing patient sharing was revoked." : "Application rejected.");
    await load();
  }
  return <Screen brand={false}>
    <Heading title="Admin portal" subtitle={`Welcome, ${user?.firstname ?? ""}`} />
    <View style={[ui.row, { gap: 12, flexWrap: "wrap" }]}>
      <Button secondary onPress={() => setSection("doctors")}>Doctor reviews</Button>
      <Button secondary onPress={() => setSection("accounts")}>Accounts</Button>
      <Button secondary onPress={() => setSection("content")}>Welcome page</Button>
      <Button secondary onPress={() => setSection("team")}>Add admins</Button>
    </View>
    {section === "accounts" ? <Accounts /> : section === "content" ? <WelcomeEditor /> : section === "team" ? <AdminTeam /> : <>
    <Notice>Review doctor applications before they can receive patient access.</Notice>
    <View style={[ui.row, { gap: 8 }]}>
      {(["PENDING", "APPROVED", "REJECTED", "REMOVED"] as const).map((option) =>
        <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: status === option }}
          onPress={() => showStatus(option)} style={{ flex: 1, minHeight: 48, borderRadius: 12,
            backgroundColor: status === option ? C.primary : C.white, borderColor: C.border, borderWidth: 1,
            alignItems: "center", justifyContent: "center" }}>
          <Text style={[ui.small, { fontWeight: "700", color: status === option ? C.white : C.primaryDark }]}>{option === "PENDING" ? "Pending" : option === "APPROVED" ? "Approved" : option === "REJECTED" ? "Rejected" : "Removed"}</Text>
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
    </>}
    <Button secondary onPress={() => void signOut()}>Sign out</Button>
  </Screen>;
}
