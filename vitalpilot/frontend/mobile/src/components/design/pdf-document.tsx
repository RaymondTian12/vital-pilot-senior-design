import React, { Component, type ReactNode } from "react";
import { Text, TurboModuleRegistry, View } from "react-native";
import { ui } from "./ui";
type Props = {
  uri: string;
  onError: () => void;
  onPage: (page: number, total: number) => void;
};
// Keep an older development build usable when the native PDF module is absent.
class ViewerBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Text style={ui.body}>
        PDF viewing needs a rebuilt development app. Download PDF is still
        available.
      </Text>
    ) : (
      this.props.children
    );
  }
}
function NativePdf({ uri, onError, onPage }: Props) {
  // Check before importing: blob-util reports a native error during module
  // initialization, even when the surrounding require is caught below.
  if (!TurboModuleRegistry.get("ReactNativeBlobUtil")) {
    return (
      <Text style={ui.body}>
        Rebuild the development app to enable the PDF viewer. You can still
        download the report.
      </Text>
    );
  }
  // Defer native loading so the fallback can render before the next app rebuild.
  let Pdf: typeof import("react-native-pdf").default;
  try {
    Pdf = require("react-native-pdf").default;
  } catch {
    return (
      <Text style={ui.body}>
        Rebuild the development app to enable the PDF viewer. You can still
        download the report.
      </Text>
    );
  }
  return (
    // Authentication and download already happened in prepareReport; only a local
    // temporary file reaches the renderer. Do not create a second cached copy.
    <Pdf
      source={{ uri, cache: false }}
      trustAllCerts={false}
      style={{ flex: 1, width: "100%" }}
      onLoadComplete={(total) => onPage(1, total)}
      onPageChanged={onPage}
      onError={onError}
      enablePaging={false}
    />
  );
}
export function PdfDocument(props: Props) {
  return (
    <View style={{ flex: 1 }}>
      <ViewerBoundary>
        <NativePdf {...props} />
      </ViewerBoundary>
    </View>
  );
}
