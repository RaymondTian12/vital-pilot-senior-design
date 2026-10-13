import { useState } from "react";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { ui } from "./ui";

export function ClinicVisual({
  photo,
  location,
}: {
  photo?: string | null;
  location: string;
}) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const realPhoto = photo?.startsWith("https://") && failedPhoto !== photo;
  return (
    <View
      style={{ borderRadius: 16, overflow: "hidden", backgroundColor: C.blue }}
    >
      {realPhoto ? (
        <Image
          source={{ uri: photo! }}
          contentFit="cover"
          style={{ height: 140, width: "100%" }}
          onError={() => setFailedPhoto(photo || null)}
          accessibilityLabel={`Clinic photo, ${location}`}
        />
      ) : (
        <View
          accessible
          accessibilityLabel="Generic clinic illustration, not a photo of this practice"
          style={{
            height: 140,
            width: "100%",
            backgroundColor: C.blue,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              right: "10%",
              top: 14,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: C.peach,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 27,
              backgroundColor: C.mintStrong,
            }}
          />
          <View
            style={{
              position: "absolute",
              left: "26%",
              right: "26%",
              top: 43,
              bottom: 12,
              backgroundColor: C.white,
              borderRadius: 4,
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -8,
                left: -6,
                right: -6,
                height: 12,
                borderRadius: 3,
                backgroundColor: C.primary,
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 12,
                left: "45%",
                width: 18,
                height: 5,
                backgroundColor: C.primary,
              }}
            />
            <View
              style={{
                position: "absolute",
                top: 6,
                left: "45%",
                marginLeft: 6,
                width: 5,
                height: 18,
                backgroundColor: C.primary,
              }}
            />
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  position: "absolute",
                  left: i % 2 === 0 ? "9%" : "73%",
                  top: i < 2 ? 17 : 46,
                  width: "18%",
                  height: 19,
                  borderRadius: 3,
                  backgroundColor: C.blue,
                }}
              />
            ))}
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: "38%",
                width: "24%",
                height: 43,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                backgroundColor: C.textSecondary,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 2,
                  bottom: 0,
                  width: 1,
                  backgroundColor: C.blue,
                }}
              />
            </View>
          </View>
          {["9%", "83%"].map((left) => (
            <View
              key={left}
              style={{
                position: "absolute",
                left: left as `${number}%`,
                bottom: 13,
                width: 36,
                height: 57,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 16,
                  height: 40,
                  width: 4,
                  backgroundColor: C.textSecondary,
                }}
              />
              <View
                style={{
                  width: 36,
                  height: 45,
                  borderRadius: 22,
                  backgroundColor: C.primary,
                }}
              />
            </View>
          ))}
        </View>
      )}
      <View style={{ paddingHorizontal: 12, paddingVertical: 9, gap: 2 }}>
        <Text style={[ui.small, { color: C.title, fontWeight: "600" }]}>
          {location}
        </Text>
        {!realPhoto && (
          <Text style={ui.small}>
            Clinic illustration · Practice photo unavailable
          </Text>
        )}
      </View>
    </View>
  );
}
