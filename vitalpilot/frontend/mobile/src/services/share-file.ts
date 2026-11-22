import * as Sharing from "expo-sharing";

export async function sharePdfFile(uri: string): Promise<string | null> {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
      return null;
    }
    return "Sharing is not available on this device. The PDF is saved on your device's app storage.";
  } catch {
    return "Could not open the share sheet for this report.";
  }
}
