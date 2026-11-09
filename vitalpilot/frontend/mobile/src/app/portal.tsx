import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect, Redirect } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";
import { Button, Card, Heading, Screen, ui } from "@/components/design/ui";
type Person = { user_id: number; firstname: string; lastname: string; role: string };
export default function AdminDirectory() {
  const { user, signOut } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [more, setMore] = useState(false), [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => {
    if (user?.role !== "admin") return;
    let active = true; setBusy(true); setError("");
    api.adminUsers().then(data => { if (active) { setPeople(data.users); setMore(data.users.length === 50); } })
      .catch(() => { if (active) setError("Couldn’t load the account directory."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [user?.user_id, user?.role, retry]));
  if (!user) return <Redirect href="/signin" />;
  if (user.role !== "admin") return <Redirect href={user.role === "provider" ? "/doctor-portal" : "/home"} />;
  async function loadMore() {
    setBusy(true); setError("");
    try { const data = await api.adminUsers(people.length); setPeople(current => [...current, ...data.users]); setMore(data.users.length === 50); }
    catch { setError("Couldn’t load more accounts."); }
    finally { setBusy(false); }
  }
  return <Screen><Heading title="Admin account directory" />
    <Text style={ui.body}>Read-only account list. Provider approval and clinical access use the team's dedicated portals.</Text>
    {!!error && <Text accessibilityRole="alert" style={ui.body}>{error}</Text>}
    {busy && <Text style={ui.body}>Loading…</Text>}
    <Button secondary disabled={busy} onPress={() => setRetry(v => v + 1)}>Refresh</Button>
    {people.map(person => <Card key={person.user_id}><Text style={ui.heading}>{person.firstname} {person.lastname}</Text><Text style={ui.body}>{person.role}</Text></Card>)}
    {more && <Button disabled={busy} onPress={() => void loadMore()}>Load more</Button>}
    <Button secondary disabled={busy} onPress={() => void signOut()}>Sign out</Button>
  </Screen>;
}
