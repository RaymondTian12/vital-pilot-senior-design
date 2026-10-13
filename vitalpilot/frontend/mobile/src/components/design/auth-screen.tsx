import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";
import { api } from "@/services/api";
import {
  getGoogleIdToken,
  googleUnavailableReason,
} from "@/services/google-auth";
import { Brand, Button, Field, Heading, Notice, Orbit, Screen, ui } from "./ui";
export function AuthScreen({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function googleSignIn() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const token = await getGoogleIdToken();
      if (!token) return;
      const isNew = await signInWithGoogle(token);
      router.replace(isNew ? "/questionnaire" : "/home");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Google sign-in failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (busy) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError("Enter a valid email and password.");
      return;
    }
    if (
      register &&
      (!first.trim() ||
        !last.trim() ||
        password.length < 8 ||
        password !== confirm)
    ) {
      setError(
        "Enter both names and matching passwords with at least 8 characters.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (register) {
        await api.signUp(first.trim(), last.trim(), email.trim(), password);
        router.replace("/signin?registered=true");
      } else {
        await signIn(email.trim(), password);
        router.replace(registered === "true" ? "/questionnaire" : "/home");
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to continue. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen back brand={false}>
      <View style={[ui.row, { justifyContent: "space-between" }]}>
        <Brand />
        <Orbit size={72} />
      </View>
      <Heading
        title={register ? "Make room for better health" : "Welcome back"}
        subtitle={
          register
            ? "Create your VitalPilot account."
            : "Sign in to continue your health journey."
        }
      />
      {!register && registered === "true" && (
        <Notice>Account created. Sign in to finish your health profile.</Notice>
      )}
      <View style={{ gap: 14 }}>
        {register && (
          <View
            style={[ui.row, { alignItems: "flex-start", flexWrap: "wrap" }]}
          >
            <Field
              label="First name"
              value={first}
              onChangeText={setFirst}
              autoComplete="given-name"
              placeholder="First name"
            />
            <Field
              label="Last name"
              value={last}
              onChangeText={setLast}
              autoComplete="family-name"
              placeholder="Last name"
            />
          </View>
        )}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder={register ? "Create a password" : "Enter your password"}
          secureTextEntry
          autoComplete={register ? "new-password" : "current-password"}
        />
        {register && (
          <>
            <Text style={ui.small}>Use at least 8 characters.</Text>
            <Field
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm your password"
              secureTextEntry
              autoComplete="new-password"
            />
          </>
        )}
      </View>
      {error ? <Notice error>{error}</Notice> : null}
      <Button loading={busy} onPress={submit}>
        {register ? "Create account" : "Sign in"}
      </Button>
      <Button
        secondary
        disabled={busy || !!googleUnavailableReason}
        onPress={googleSignIn}
      >
        Continue with Google
      </Button>
      {googleUnavailableReason ? (
        <Text style={ui.small}>{googleUnavailableReason}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => router.replace(register ? "/signin" : "/signup")}
        style={{
          minHeight: 48,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={ui.body}>
          {register ? "Already have an account? " : "New to VitalPilot? "}
          <Text style={ui.link}>{register ? "Sign in" : "Create account"}</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}
