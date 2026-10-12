import { Image } from "expo-image";
import { Text, View } from "react-native";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
import { ui } from "./ui";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160">
<rect width="360" height="160" rx="16" fill="#D9EAF4"/><circle cx="305" cy="32" r="18" fill="#FFC7A4"/>
<path d="M0 130 Q90 105 180 132 T360 125 V160 H0Z" fill="#D5ECEF"/>
<rect x="95" y="48" width="172" height="96" rx="5" fill="#FFFFFF"/>
<rect x="89" y="41" width="184" height="13" rx="4" fill="#087F83"/>
<rect x="158" y="91" width="46" height="53" rx="3" fill="#536B7C"/>
<path d="M181 94v47" stroke="#D9EAF4" stroke-width="2"/>
<g fill="#D9EAF4"><rect x="110" y="69" width="30" height="23" rx="3"/><rect x="222" y="69" width="30" height="23" rx="3"/><rect x="110" y="105" width="30" height="23" rx="3"/><rect x="222" y="105" width="30" height="23" rx="3"/></g>
<path d="M181 62v17 M173 70h16" stroke="#087F83" stroke-width="5" stroke-linecap="round"/>
<path d="M51 141V99 M308 141v-33" stroke="#536B7C" stroke-width="5"/><ellipse cx="51" cy="94" rx="23" ry="28" fill="#087F83"/><ellipse cx="308" cy="103" rx="19" ry="22" fill="#087F83"/>
</svg>`;

export function ClinicVisual({
  photo,
  location,
}: {
  photo?: string | null;
  location: string;
}) {
  const realPhoto = photo?.startsWith("https://");
  return (
    <View
      style={{ borderRadius: 16, overflow: "hidden", backgroundColor: C.blue }}
    >
      <Image
        source={{
          uri: realPhoto
            ? photo!
            : `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
        }}
        contentFit="cover"
        style={{ height: 140, width: "100%" }}
        accessibilityLabel={
          realPhoto
            ? `Clinic photo, ${location}`
            : "Generic clinic illustration, not a photo of this practice"
        }
      />
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
