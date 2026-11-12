import * as FileSystem from "expo-file-system/legacy";
import { session } from "./session";

export async function downloadReportFile(endpoint: string, filename: string) {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");
  if (!base || !FileSystem.cacheDirectory)
    throw new Error("Report server or temporary storage is not configured.");
  const version = session.version();
  const token = await session.get();
  if (!token || version !== session.version())
    throw new Error("Sign in again to download this report.");
  const destination = `${FileSystem.cacheDirectory}${filename}`;
  const cleanup = () =>
    FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => {});
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  // The native download may finish after a timeout; remove that late file too.
  const operation = FileSystem.downloadAsync(
    `${base}${endpoint}`,
    destination,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  ).then(async (result) => {
    if (expired) await cleanup();
    return result;
  });
  try {
    const result = await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(
            new Error(
              "Report request timed out. Check report history before retrying generation.",
            ),
          );
        }, 90000);
      }),
    ]);
    if (version !== session.version())
      throw new Error("Account changed. Report download cancelled.");
    if (result.status !== 200)
      throw new Error(
        result.status === 401
          ? "Your session expired. Sign in again."
          : `Report request failed (${result.status}). Check report history before retrying generation.`,
      );
    const entry = Object.entries(result.headers ?? {}).find(
      ([key]) => key.toLowerCase() === "x-report-id",
    );
    const id = Number(entry?.[1]);
    return {
      uri: result.uri,
      filename,
      reportId: Number.isSafeInteger(id) && id > 0 ? id : null,
    };
  } catch (error) {
    await cleanup();
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
