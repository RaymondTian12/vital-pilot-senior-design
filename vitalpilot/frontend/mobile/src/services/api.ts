import * as FileSystem from "expo-file-system/legacy";
import { chatHistory } from "./chat-session";
import { session } from "./session";
import type {
  AuthUser,
  QuestionnaireRequest,
  Doctor,
} from "@/types/vitalpilot";
import type {
  ChatMessage,
  ChatContextSelection,
  ChatContext,
  ChatResponse,
  BloodPressureReading,
  BloodPressurePage,
  SignInResponse,
  SignUpResponse,
} from "@/types/vitalpilot";
import type { VitalNotification } from "@/types/notification";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(
  /\/$/,
  "",
);
export interface ReportHistoryItem {
  report_id: number;
  report_title: string;
  start_date: string;
  end_date: string;
  file_size_kb: number;
  created_at: string;
  downloadable: boolean;
  previewable: boolean;
}
export interface ReportPreviewData {
  period_label: string;
  start_date: string;
  end_date: string;
  patient: {
    name: string;
    age: number;
    sex: string;
    dob: string;
    height_in: number;
    latest_weight_lbs: number | null;
  };
  narrative: { hpi: string; summary: string };
  previous_report: { start_date: string; end_date: string } | null;
  metrics: {
    metric_type: string;
    label: string;
    unit: string;
    count: number;
    fields: Record<string, { min: number; max: number; avg: number }>;
  }[];
  alerts: {
    metric_type: string;
    classification: string;
    recorded_at: string;
    severity: "URGENT" | "WARNING";
  }[];
}
interface NotificationRecord {
  notification_id: number;
  title: string;
  message: string;
  severity: "info" | "success" | "warning" | "critical";
  category: "metric" | "report" | "reminder" | "system" | "health-alert";
  metric_name: string | null;
  metric_value: string | null;
  action_label: string | null;
  action_route: string | null;
  is_read: boolean;
  created_at: string;
}
function toVitalNotification(record: NotificationRecord): VitalNotification {
  return {
    id: String(record.notification_id),
    title: record.title,
    message: record.message,
    severity: record.severity,
    category: record.category,
    read: record.is_read,
    createdAt: record.created_at,
    metricName: record.metric_name ?? undefined,
    metricValue: record.metric_value ?? undefined,
    action: record.action_label && record.action_route
      ? { label: record.action_label, route: record.action_route }
      : undefined,
  };
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number | null = null,
    public uncertain = false,
  ) {
    super(message);
  }
}
async function request<T>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs = 15000,
): Promise<T> {
  if (!API_BASE_URL)
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  const version = session.version?.();
  const token = await session.get();
  if (version !== session.version?.())
    throw new ApiError("Account changed. Please try again.");
  const post = options?.method === "POST";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      credentials: "omit",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    // Keep the abort timeout active while receiving/parsing the response body.
    const body = await response.json().catch(() => null);
    if (version !== session.version?.())
      throw new ApiError("Account changed. Please try again.", null, post);
    if (!response.ok) {
      const message =
        typeof body?.detail === "string"
          ? body.detail
          : Array.isArray(body?.detail)
            ? body.detail
                .map(
                  (item: { loc?: string[]; msg?: string }) =>
                    `${item.loc?.slice(1).join(".") || "Request"}: ${item.msg || "Invalid value"}`,
                )
                .join("\n")
            : `Request failed with status ${response.status}`;
      throw new ApiError(
        message,
        response.status,
        post && response.status >= 500,
      );
    }
    if (body === null)
      throw new ApiError(
        "The server returned an unreadable response.",
        null,
        post,
      );
    return body as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (endpoint.startsWith("/chat") && controller.signal.aborted)
      throw new ApiError(
        "Pilot AI took too long to respond. Please retry your message.",
        null,
        post,
      );
    throw new ApiError(
      "Cannot reach the server. Check your connection and mobile API URL.",
      null,
      post,
    );
  } finally {
    clearTimeout(timeout);
  }
}
export const api = {
  metricHistory: (
    metric: import("@/types/vitalpilot").VitalType,
    window: { start_at: string; end_at: string; timezone_name: string },
    offset = 0,
  ) =>
    request<import("./metric-history").MetricHistoryData>(
      `/metrics/history?${new URLSearchParams({ metric_type: metric, start_at: window.start_at, end_at: window.end_at, timezone_name: window.timezone_name, limit: "20", offset: String(offset) })}`,
    ),
  adminUsers: (offset = 0) =>
    request<{
      users: {
        user_id: number;
        firstname: string;
        lastname: string;
        role: string;
      }[];
    }>(`/admin/users?offset=${offset}`),
  metricReport: (window: {
    start_at: string;
    today_start: string;
    end_at: string;
  }) =>
    request<import("./daily-summary").DailySummaryResponse>(
      `/metric-report?${new URLSearchParams({ ...window, timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone })}`,
    ),
  goals: () =>
    request<{
      goals: Partial<Record<import("@/types/vitalpilot").VitalType, number>>;
    }>("/goals"),
  updateGoals: (goals: Record<string, number>) =>
    request<{
      goals: Partial<Record<import("@/types/vitalpilot").VitalType, number>>;
    }>("/goals", { method: "PATCH", body: JSON.stringify(goals) }),
  createAdmin: (payload: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
  }) =>
    request<{ user_id: number; email: string; role: "admin" }>(
      "/admin/admins",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  welcomeSlides: () =>
    request<{ slides: import("@/constants/welcome-slides").WelcomeSlide[] }>(
      "/content/welcome",
    ),
  updateWelcomeSlide: (
    slide: import("@/constants/welcome-slides").WelcomeSlide,
  ) =>
    request<import("@/constants/welcome-slides").WelcomeSlide>(
      `/admin/welcome-slides/${slide.slide_number}`,
      {
        method: "PUT",
        body: JSON.stringify(slide),
      },
    ),
  adminAccounts: (
    search: string,
    role: "patient" | "provider" | "admin" | "",
    offset = 0,
  ) =>
    request<{ accounts: import("@/types/vitalpilot").AdminAccount[] }>(
      `/admin/accounts?search=${encodeURIComponent(search)}${role ? `&role=${role}` : ""}&limit=50&offset=${offset}`,
    ),
  changeAccountStatus: (id: number, active: boolean, reason: string) =>
    request<{ user_id: number; is_active: boolean }>(
      `/admin/accounts/${id}/status`,
      {
        method: "POST",
        body: JSON.stringify({ active, reason }),
      },
    ),
  adminProviders: (
    status: "PENDING" | "APPROVED" | "REJECTED" | "REMOVED" = "PENDING",
    offset = 0,
  ) =>
    request<{ providers: import("@/types/vitalpilot").AdminProvider[] }>(
      `/admin/providers?status=${status}&limit=50&offset=${offset}`,
    ),
  reviewProvider: (
    id: number,
    decision: "APPROVED" | "REJECTED" | "REMOVED",
    note: string,
    identity_and_license_verified: boolean,
    confirm_revoke_patient_access = false,
  ) =>
    request<{ status: "APPROVED" | "REJECTED" | "REMOVED" }>(
      `/admin/providers/${id}/review`,
      {
        method: "POST",
        body: JSON.stringify({
          decision,
          note,
          identity_and_license_verified,
          confirm_revoke_patient_access,
        }),
      },
    ),
  registerDoctor: (payload: {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    npi: string;
    specialty: string;
    license_state: string;
    license_number: string;
  }) =>
    request<{ message: string; status: string }>("/auth/register-provider", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  doctorStatus: () =>
    request<{ status: "PENDING" | "APPROVED" | "REJECTED" | "REMOVED" }>(
      "/portal/provider-status",
    ),
  myProviders: () =>
    request<{
      providers: {
        provider_id: number;
        first_name: string;
        last_name: string;
        specialty: string;
        status: string;
      }[];
    }>("/portal/my-providers"),
  grantProvider: (id: number) =>
    request<{ status: string }>(`/portal/my-providers/${id}`, {
      method: "PUT",
    }),
  revokeProvider: (id: number) =>
    request<{ status: string }>(`/portal/my-providers/${id}`, {
      method: "DELETE",
    }),
  doctorPatients: () =>
    request<{
      patients: {
        user_id: number;
        first_name: string;
        last_name: string;
        date_of_birth: string;
      }[];
    }>("/portal/patients"),
  doctorPatient: (id: number) =>
    request<{
      user_id: number;
      first_name: string;
      last_name: string;
      date_of_birth: string;
    }>(`/portal/patients/${id}`),
  doctorPatientMetrics: (
    id: number,
    metric: import("@/types/vitalpilot").VitalType,
  ) =>
    request<{
      records: {
        log_id: number;
        recorded_at: string;
        metric_type: string;
        [key: string]: unknown;
      }[];
    }>(`/portal/patients/${id}/metrics?metric_type=${metric}`),
  doctorPatientAlerts: (id: number) =>
    request<{
      alerts: {
        notification_id: number;
        title: string;
        message: string;
        severity: "warning" | "critical";
        category: string;
        metric_name: string | null;
        metric_value: string | null;
        created_at: string;
      }[];
    }>(`/portal/patients/${id}/alerts`),
  doctorPatientReports: (id: number) =>
    request<{
      reports: {
        report_id: number;
        report_title: string;
        start_date: string;
        end_date: string;
        file_size_kb: number;
        created_at: string;
        downloadable: boolean;
        previewable: boolean;
      }[];
    }>(`/portal/patients/${id}/reports`),
  doctorPatientReportPreview: (id: number, reportId: number) =>
    request<ReportPreviewData>(`/portal/patients/${id}/reports/${reportId}/preview`),
  async doctorPatientReportDownload(id: number, reportId: number): Promise<{ uri: string; filename: string; reportId: number | null }> {
    const filename = `vitalpilot-report-${reportId}-${Date.now()}.pdf`;
    return downloadReportFile(`/portal/patients/${id}/reports/${reportId}/download`, filename);
  },
  dailySummary: (window: {
    start_at: string;
    today_start: string;
    end_at: string;
  }) =>
    request<import("./daily-summary").DailySummaryResponse>(
      `/daily-summary?${new URLSearchParams({ ...window, timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone })}`,
    ),
  submitVital: (
    metricType: import("@/types/vitalpilot").OtherVitalType,
    values: Record<string, number | string>,
  ) =>
    request<import("@/types/vitalpilot").OtherMetricReading>("/metrics", {
      method: "POST",
      body: JSON.stringify({
        ...values,
        metric_type: metricType,
        ...(["SLEEP", "WATER_INTAKE", "PHYSICAL_ACTIVITY"].includes(metricType)
          ? { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }
          : {}),
      }),
    }),
  getVital: (
    metricType: import("@/types/vitalpilot").OtherVitalType,
    offset = 0,
  ) =>
    request<{
      count: number;
      records: import("@/types/vitalpilot").OtherMetricReading[];
    }>(`/metrics?metric_type=${metricType}&limit=20&offset=${offset}`),
  clinicPhoto: (npi: string) =>
    request<import("@/types/vitalpilot").ClinicPhoto>(
      `/doctors/${encodeURIComponent(npi)}/clinic-photo`,
      undefined,
      60000,
    ),
  signInWithGoogle: (idToken: string) =>
    request<
      SignInResponse & {
        is_new_user: boolean;
      }
    >("/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    }),
  async signIn(email: string, password: string): Promise<SignInResponse> {
    return request<SignInResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  async signUp(
    firstname: string,
    lastname: string,
    email: string,
    password: string,
  ): Promise<SignUpResponse> {
    return request<SignUpResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstname, lastname, email, password }),
    });
  },
  saveQuestionnaire: (payload: QuestionnaireRequest) =>
    request<{
      message: string;
    }>("/auth/questionnare", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCareTeam: (specialty = "") =>
    request<{
      source: string;
      count: number;
      doctors: {
        provider_id: number;
        npi: string;
        first_name: string;
        last_name: string;
        specialty: string;
        license_state: string;
        clinic_name: string | null;
        phone: string | null;
      }[];
    }>(
      `/care-team${specialty ? `?specialty=${encodeURIComponent(specialty)}` : ""}`,
    ),
  searchDoctors: (filters: {
    latitude?: number;
    longitude?: number;
    specialty?: string;
    city?: string;
    state?: string;
    gender?: string;
  }) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters))
      if (value !== undefined && String(value).trim())
        query.set(key, String(value).trim());
    return request<{
      count: number;
      doctors: Doctor[];
      distance_incomplete?: boolean;
    }>(`/doctors/search?${query}`, undefined, 45000);
  },
  me: () => request<AuthUser>("/auth/me"),
  logout: () =>
    request<{
      message: string;
    }>("/auth/logout", { method: "POST" }),
  chatContext: (selection: ChatContextSelection) =>
    request<ChatContext>(
      "/chat/context",
      { method: "POST", body: JSON.stringify(selection) },
      40000,
    ),
  async chat(
    message: string,
    history: ChatMessage[],
    context?: ChatContextSelection,
  ): Promise<ChatResponse> {
    return request<ChatResponse>(
      "/chat",
      {
        method: "POST",
        body: JSON.stringify({
          message,
          history: chatHistory(history).map(({ role, text }) => ({
            role,
            content: text,
          })),
          ...(context ? { context, context_consent: true } : {}),
        }),
      },
      40000,
    );
  },
  submitBloodPressure: (systolic: number, diastolic: number) =>
    request<BloodPressureReading>("/metrics", {
      method: "POST",
      body: JSON.stringify({
        metric_type: "BLOOD_PRESSURE",
        systolic_mmhg: systolic,
        diastolic_mmhg: diastolic,
      }),
    }),
  getBloodPressure: (offset = 0) =>
    request<BloodPressurePage>(
      `/metrics?metric_type=BLOOD_PRESSURE&limit=20&offset=${offset}`,
    ),
  async generateReport(days: 7 | 30 | 90): Promise<{ uri: string; filename: string; reportId: number | null }> {
    const filename = `vitalpilot-report-${days}day-${Date.now()}.pdf`;
    return downloadReportFile(`/reports/generate?days=${days}`, filename);
  },
  getReportHistory: () =>
    request<{ reports: ReportHistoryItem[] }>("/reports/history"),
  async downloadReport(reportId: number): Promise<{ uri: string; filename: string; reportId: number | null }> {
    const filename = `vitalpilot-report-${reportId}-${Date.now()}.pdf`;
    return downloadReportFile(`/reports/${reportId}/download`, filename);
  },
  getReportPreview: (reportId: number) =>
    request<ReportPreviewData>(`/reports/${reportId}/preview`),
  async getNotifications(): Promise<{ notifications: VitalNotification[]; unreadCount: number }> {
    const { notifications, unread_count } = await request<{
      notifications: NotificationRecord[];
      unread_count: number;
    }>("/notifications");
    return { notifications: notifications.map(toVitalNotification), unreadCount: unread_count };
  },
  markNotificationRead: (id: string) =>
    request<{ notification_id: number; is_read: boolean }>(`/notifications/${id}/read`, {
      method: "POST",
    }),
  markAllNotificationsRead: () =>
    request<{ updated: number }>("/notifications/read-all", { method: "POST" }),
  deleteNotification: (id: string) =>
    request<{ notification_id: number }>(`/notifications/${id}`, { method: "DELETE" }),
  clearNotifications: () =>
    request<{ cleared: number }>("/notifications", { method: "DELETE" }),
};

function headerValue(
  headers: Record<string, string> | undefined,
  name: string,
): string | null {
  if (!headers) return null;
  const key = Object.keys(headers).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  );
  return key ? headers[key] : null;
}

async function downloadReportFile(
  endpoint: string,
  filename: string,
): Promise<{ uri: string; filename: string; reportId: number | null }> {
  if (!API_BASE_URL)
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  const token = await session.get();
  const destination = `${FileSystem.documentDirectory}${filename}`;
  const result = await FileSystem.downloadAsync(
    `${API_BASE_URL}${endpoint}`,
    destination,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (result.status !== 200)
    throw new ApiError(
      `Failed to download report (status ${result.status}).`,
      result.status,
    );
  const reportIdHeader = headerValue(result.headers, "X-Report-Id");
  const parsedReportId = reportIdHeader ? Number(reportIdHeader) : NaN;
  return { uri: result.uri, filename, reportId: Number.isFinite(parsedReportId) ? parsedReportId : null };
}
