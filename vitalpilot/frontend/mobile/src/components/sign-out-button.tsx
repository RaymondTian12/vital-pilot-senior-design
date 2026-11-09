import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button, Notice } from "@/components/design/ui";

export function SignOutButton() {
  const { signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await signOut();
    } catch {
      setError("Unable to clear the session. Please try again.");
      setBusy(false);
    }
  }

  return <>
    <Button secondary icon="logout" loading={busy} onPress={() => void logout()}>Sign out</Button>
    {!!error && <Notice error>{error}</Notice>}
  </>;
}
