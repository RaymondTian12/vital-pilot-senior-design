import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { api } from "@/services/api";
import type { AdminAccount, AdminInvitation } from "@/types/vitalpilot";
import { Button, Card, Empty, Field, Heading, Notice, ui } from "@/components/design/ui";

export function AdminTeam() {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [invitations, setInvitations] = useState<AdminInvitation[]>([]);
  const [code, setCode] = useState("");
  const [invitedEmail, setInvitedEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<number | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [accountResponse, inviteResponse] = await Promise.all([
        api.adminAccounts("", "admin"), api.adminInvitations(),
      ]);
      setAccounts(accountResponse.accounts);
      setInvitations(inviteResponse.invitations);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to load admin accounts."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function invite() {
    if (busy) return;
    if (!first.trim() || !last.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter both names and a valid email address."); return;
    }
    setBusy(true); setError(""); setCode("");
    try {
      const result = await api.inviteAdmin({ first_name: first.trim(), last_name: last.trim(), email: email.trim() });
      setInvitedEmail(result.email);
      setCode(result.code);
      setFirst(""); setLast(""); setEmail("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to create invitation."); }
    finally { setBusy(false); }
  }
  async function revoke(id: number) {
    if (revoking !== null) return;
    setRevoking(id); setError("");
    try { await api.revokeAdminInvitation(id); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to revoke invitation."); }
    finally { setRevoking(null); }
  }
  return <View style={ui.stack}>
    <Heading title="Admin team" subtitle="Invite teammates to create their own admin accounts." />
    <Notice>Each admin gets a separate password. The invitation code appears once and expires after 48 hours. Share it privately with the person you invited.</Notice>
    <Card>
      <Text style={ui.heading}>Invite an admin</Text>
      <Field label="First name" value={first} onChangeText={setFirst} autoComplete="given-name" />
      <Field label="Last name" value={last} onChangeText={setLast} autoComplete="family-name" />
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
      <Button loading={busy} onPress={() => void invite()}>Create invitation</Button>
    </Card>
    {!!code && <Card>
      <Text style={ui.heading}>Invitation for {invitedEmail}</Text>
      <Text style={ui.body}>Give this code privately to your teammate. They can select “Have an admin invitation?” on admin sign-in and set their own password.</Text>
      <Text selectable accessibilityLabel="One-time admin invitation code" style={ui.body}>{code}</Text>
      <Button secondary onPress={() => { setCode(""); setInvitedEmail(""); }}>I saved the code</Button>
    </Card>}
    {!!error && <Notice error>{error}</Notice>}
    <Heading title="Current admins" subtitle="Each account signs in separately." />
    {loading && <Text style={ui.body}>Loading admin team…</Text>}
    {!loading && !error && !accounts.length && <Empty title="No admins found" message="Refresh to load admin accounts." />}
    {accounts.map((account) => <Card key={account.user_id}>
      <Text style={ui.heading}>{account.first_name} {account.last_name}</Text>
      <Text style={ui.small}>{account.email}</Text>
    </Card>)}
    <Heading title="Invitations" subtitle="Codes are shown only when first created." />
    {!loading && !error && !invitations.length && <Empty title="No invitations" message="Create an invitation above to add an admin." />}
    {invitations.map((invitation) => {
      const pending = !invitation.used_at && !invitation.revoked_at && Date.parse(`${invitation.expires_at}Z`) > Date.now();
      return <Card key={invitation.invitation_id}>
        <Text style={ui.heading}>{invitation.first_name} {invitation.last_name}</Text>
        <Text style={ui.small}>{invitation.email}</Text>
        <Text style={ui.body}>{invitation.used_at ? "Used" : invitation.revoked_at ? "Revoked" : pending ? "Pending" : "Expired"}</Text>
        {pending && <Button secondary loading={revoking === invitation.invitation_id} disabled={revoking !== null && revoking !== invitation.invitation_id} onPress={() => void revoke(invitation.invitation_id)}>Revoke invitation</Button>}
      </Card>;
    })}
    <Button secondary onPress={() => void load()}>Refresh admin team</Button>
  </View>;
}
