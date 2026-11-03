import { Platform } from "react-native";
import { session } from "./session";

// Auth stays in headers. Local copies are temporary and removed after sharing.
export async function shareReport(reportId: number) {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");
  if (!base) throw new Error("Server address is not configured.");
  const version = session.version();
  const token = await session.get();
  if (!token || version !== session.version()) throw new Error("Sign in again to download this report.");
  const url = `${base}/reports/${reportId}/pdf`;
  if (Platform.OS === "web") {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error("Report could not be downloaded.");
    const blob = await response.blob();
    if (version !== session.version()) throw new Error("Account changed. Download cancelled.");
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = objectUrl; link.download = `VitalPilot-report-${reportId}.pdf`; link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    return;
  }
  let fs: typeof import("expo-file-system/legacy");
  let sharing: typeof import("expo-sharing");
  try { fs = require("expo-file-system/legacy"); sharing = require("expo-sharing"); }
  catch { throw new Error("Rebuild the development app to enable PDF sharing."); }
  if (!fs.cacheDirectory || !await sharing.isAvailableAsync()) throw new Error("PDF sharing is unavailable on this device. Rebuild the development app if it was recently updated.");
  const path = `${fs.cacheDirectory}VitalPilot-report-${reportId}-${Date.now()}.pdf`;
  try {
    const response = await fs.downloadAsync(url, path, { headers: { Authorization: `Bearer ${token}` } });
    if (response.status !== 200) throw new Error("Report download failed. Refresh report history and retry.");
    if (version !== session.version()) throw new Error("Account changed. Download cancelled.");
    await sharing.shareAsync(path, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Share your VitalPilot report" });
  } finally { await fs.deleteAsync(path, { idempotent: true }).catch(() => {}); }
}
