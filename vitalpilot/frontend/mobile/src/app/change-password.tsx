import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";
import {
  Button,
  Card,
  Field,
  Heading,
  Notice,
  Orbit,
  Screen,
  ui,
} from "@/components/design/ui";
export default function ChangePassword() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (busy) return;
    if (!current || next.length < 8 || next !== confirm || next === current) {
      setError("Enter your current password and a different, matching new password with at least 8 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.changePassword(current, next);
      await signOut();
      router.replace("/signin?passwordChanged=true");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const back = user?.role === "provider" ? "/doctor-portal" : user?.role === "admin" ? "/admin-portal" : "/profile";
  return (
    <Screen>
      <Heading title="Change password" subtitle="Update your account password." />
      <Orbit size={145} icon="lock" />
      <Card>
        <Field
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          placeholder="Enter your current password"
          secureTextEntry
          autoComplete="current-password"
        />
        <Field
          label="New password"
          value={next}
          onChangeText={setNext}
          placeholder="Create a new password"
          secureTextEntry
          autoComplete="new-password"
        />
        <Text style={ui.small}>
          Use at least 8 characters and choose a different password.
        </Text>
        <Field
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm your new password"
          secureTextEntry
          autoComplete="new-password"
        />
        {error ? <Notice error>{error}</Notice> : null}
        <Button loading={busy} onPress={() => void submit()}>Update password</Button>
      </Card>
      <Button secondary disabled={busy} onPress={() => router.replace(back)}>
        Back to account
      </Button>
    </Screen>
  );
}
