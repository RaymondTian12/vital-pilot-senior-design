import { View } from "react-native";
// Expo resolves this file for browsers; native builds use pdf-document.tsx.
export function PdfDocument({
  uri,
  onError,
}: {
  uri: string;
  onError: () => void;
  onPage: (page: number, total: number) => void;
}) {
  // The parent supplies an authenticated Blob URL, never a public report URL.
  // It also owns revoking that URL when the viewer closes.
  return (
    <View style={{ flex: 1 }}>
      <iframe
        title="Generated VitalPilot PDF report"
        src={uri}
        onError={onError}
        style={{ width: "100%", height: "100%", minHeight: 480, border: 0 }}
      />
    </View>
  );
}
