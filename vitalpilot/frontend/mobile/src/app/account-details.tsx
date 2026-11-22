import { useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@/context/auth-context";
import { api, ApiError } from "@/services/api";
import { Button, Card, Field, Heading, Notice, Screen, ui } from "@/components/design/ui";

const ROLE_LABELS: Record<string, string> = {
  patient: "Patient",
  provider: "Provider",
  admin: "Admin",
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={ui.eyebrow}>{label}</Text>
      <Text style={ui.body}>{value}</Text>
    </View>
  );
}

export default function AccountDetails() {
  const { user, updateUser } = useAuth();
  const [firstname, setFirstname] = useState(user?.firstname ?? "");
  const [lastname, setLastname] = useState(user?.lastname ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const trimmedFirst = firstname.trim();
  const trimmedLast = lastname.trim();
  const unchanged =
    trimmedFirst === (user?.firstname ?? "") && trimmedLast === (user?.lastname ?? "");

  async function save() {
    if (!trimmedFirst || !trimmedLast || unchanged) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await api.updateProfile(trimmedFirst, trimmedLast);
      updateUser(updated);
      setFirstname(updated.firstname);
      setLastname(updated.lastname);
      setSaved(true);
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Couldn't update your account details.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen back>
      <Heading title="Account details" subtitle="Your name, as it appears across VitalPilot." />
      {!!error && <Notice error>{error}</Notice>}
      {saved && <Notice>Saved.</Notice>}
      <Card style={{ gap: 16 }}>
        <Field
          label="First name"
          value={firstname}
          onChangeText={(value) => {
            setFirstname(value);
            setSaved(false);
          }}
          autoCapitalize="words"
          maxLength={50}
        />
        <Field
          label="Last name"
          value={lastname}
          onChangeText={(value) => {
            setLastname(value);
            setSaved(false);
          }}
          autoCapitalize="words"
          maxLength={50}
        />
        <Button
          disabled={saving || !trimmedFirst || !trimmedLast || unchanged}
          onPress={() => void save()}
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>
      <Card style={{ gap: 16 }}>
        <Detail label="Email" value={user?.email ?? "—"} />
        <Detail
          label="Account type"
          value={(user?.role && ROLE_LABELS[user.role]) || "—"}
        />
        <Detail
          label="Member since"
          value={
            user?.created_at
              ? new Date(user.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"
          }
        />
        <Text style={ui.small}>
          Email, account type, and member-since date can't be changed here.
        </Text>
      </Card>
    </Screen>
  );
}
