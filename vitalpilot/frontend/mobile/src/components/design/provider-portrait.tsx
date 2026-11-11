import { useState } from "react";
import { Image } from "expo-image";
import { Linking, Pressable, Text, View } from "react-native";
import type { Doctor } from "@/types/vitalpilot";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { ui } from "./ui";
import { Icon } from "./icon";

export function ProviderPortrait({ doctor }: { doctor: Doctor }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const [sourceError, setSourceError] = useState(false);
  const name = [doctor.first_name, doctor.last_name].filter(Boolean).join(" ");
  const initials =
    [doctor.first_name?.[0], doctor.last_name?.[0]].filter(Boolean).join("") ||
    "HC";
  // Only the curated portrait field represents a doctor. Clinic/Places photos
  // and legacy photo_url values must never become a provider headshot.
  const url = doctor.portrait_url;
  const visible = !!url?.startsWith("https://") && url !== failedUrl;
  return (
    <View style={{ gap: 8 }}>
      <View style={[ui.row, { alignItems: "flex-start" }]}>
        {visible ? (
          <Image
            source={{ uri: url! }}
            recyclingKey={String(doctor.npi)}
            contentFit="cover"
            style={{ height: 72, width: 72, borderRadius: 20 }}
            accessibilityLabel={`Portrait of ${name}`}
            onError={() => setFailedUrl(url!)}
          />
        ) : (
          <View
            style={{
              height: 72,
              width: 72,
              borderRadius: 20,
              backgroundColor: C.mint,
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
            accessibilityLabel="Provider initials, verified portrait unavailable"
          >
            <Text style={[ui.heading, { color: C.primaryDark }]}>
              {initials}
            </Text>
            <Icon name="doctor" size={20} />
          </View>
        )}
        <View style={{ flex: 1, gap: 5 }}>
          <Text style={ui.heading}>{name}</Text>
          {!!doctor.credential && (
            <Text style={[ui.small, { color: C.primaryDark }]}>
              {doctor.credential}
            </Text>
          )}
          <Text style={ui.small}>
            {doctor.matched_specialty && !doctor.matched_specialty_is_primary
              ? "Matched specialty: "
              : ""}
            {doctor.matched_specialty ||
              doctor.specialty ||
              "Specialty not listed"}
          </Text>
        </View>
      </View>
      {visible && doctor.portrait_source_url?.startsWith("https://") && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`View official portrait source for ${name}`}
          style={{ minHeight: 48, justifyContent: "center" }}
          onPress={() => {
            setSourceError(false);
            void Linking.openURL(doctor.portrait_source_url!).catch(() =>
              setSourceError(true),
            );
          }}
        >
          <Text style={ui.link}>
            {doctor.portrait_attribution || "Official provider portrait source"}
          </Text>
        </Pressable>
      )}
      {sourceError && (
        <Text accessibilityRole="alert" style={ui.small}>
          Couldn’t open the portrait source. Please try again.
        </Text>
      )}
    </View>
  );
}
