import Constants from "expo-constants";
import { Platform } from "react-native";

// OAuth client IDs identify the app; they are public, not client secrets.
const webClientId =
  "123952545473-fk0i639tdqtgh3cm98sh17d1474vrqlc.apps.googleusercontent.com";
const iosClientId =
  "123952545473-snihrina8crjf4s8iuu563jnoct86e47.apps.googleusercontent.com";

export const googleUnavailableReason =
  Platform.OS !== "ios"
    ? "Google sign-in is currently configured for the iPhone development build."
    : Constants.executionEnvironment === "storeClient"
      ? "Google sign-in requires the VitalPilot development build, rather than Expo Go."
      : null;

export async function getGoogleIdToken(): Promise<string | null> {
  if (googleUnavailableReason) throw new Error(googleUnavailableReason);
  // Loading only after the platform/build check keeps Expo Go usable.
  const { GoogleSignin, isSuccessResponse } =
    await import("@react-native-google-signin/google-signin");
  GoogleSignin.configure({ webClientId, iosClientId });
  const result = await GoogleSignin.signIn();
  if (!isSuccessResponse(result)) return null; // User dismissed the account picker.
  if (!result.data.idToken)
    throw new Error("Google did not return a sign-in token. Please try again.");
  return result.data.idToken;
}
