import { Image } from "expo-image";
import { Text, View } from "react-native";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { ui } from "./ui";
export function Sparkline({
  values,
  color = C.primary,
}: {
  values: number[];
  color?: string;
}) {
  const low = Math.min(...values),
    range = Math.max(...values) - low || 1;
  const points = values
    .map(
      (v, i) =>
        `${8 + (i * 144) / Math.max(values.length - 1, 1)},${40 - ((v - low) / range) * 28}`,
    )
    .join(" ");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48"><polyline points="${points}" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  return (
    <Image
      accessibilityLabel={`Sample trend: ${values.join(", ")}`}
      contentFit="fill"
      source={{ uri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}` }}
      style={{ width: "100%", height: 48 }}
    />
  );
}
export function SleepChart() {
  const values = [6, 7.5, 8, 6.5, 7, 8.5, 7];
  return (
    <View
      accessible
      accessibilityLabel="Sample sleep chart in hours. Sunday 6, Monday 7.5, Tuesday 8, Wednesday 6.5, Thursday 7, Friday 8.5, Saturday 7."
      style={{ gap: 12 }}
    >
      <Text style={ui.small}>Hours · sample data</Text>
      <View style={[ui.row, { alignItems: "flex-end", height: 130, gap: 8 }]}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center", gap: 6 }}>
            <Text style={[ui.small, { fontSize: 11 }]}>{v}</Text>
            <View
              style={{
                width: "100%",
                height: v * 10,
                borderTopLeftRadius: 7,
                borderTopRightRadius: 7,
                backgroundColor: i === 1 ? C.primary : "#A9D6EF",
              }}
            />
            <Text style={[ui.small, { fontSize: 11 }]}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
