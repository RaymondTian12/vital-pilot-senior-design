import { session } from "./session";
import type {
  AuthUser,
  QuestionnaireRequest,
  Doctor,
} from "@/types/vitalpilot";
import type {
  ChatMessage,
  ChatResponse,
  BloodPressureReading,
  BloodPressurePage,
  SignInResponse,
  SignUpResponse,
} from "@/types/vitalpilot";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(
  /\/$/,
  "",
);
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
  reportCapabilities: () => request<{ai_available:boolean;ai_provider:string}>("/reports/capabilities"),
  reportHistory: (offset=0) => request<{reports:import("@/components/design/report-exports").GeneratedReport[]}>(`/reports?offset=${offset}`),
  generateReport: (payload: {start_at:string;today_start:string;end_at:string;timezone_name:string;include_ai:boolean;ai_consent:boolean}) => request<import("@/components/design/report-exports").GeneratedReport>("/reports",{method:"POST",body:JSON.stringify(payload)},90000),
  adminUsers: (offset=0) => request<{users:{user_id:number;firstname:string;lastname:string;role:string}[]}>(`/admin/users?offset=${offset}`),
  metricReport: (window: { start_at: string; today_start: string; end_at: string }) => request<import("./daily-summary").DailySummaryResponse>(`/metric-report?${new URLSearchParams({ ...window, timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone })}`),
  goals: () => request<{ goals: Partial<Record<import("@/types/vitalpilot").VitalType, number>> }>("/goals"),
  updateGoals: (goals: Record<string, number>) => request<{ goals: Partial<Record<import("@/types/vitalpilot").VitalType, number>> }>("/goals", { method: "PATCH", body: JSON.stringify(goals) }),
  registerDoctor: (payload: { firstname: string; lastname: string; email: string; password: string; npi: string; specialty: string; license_state: string; license_number: string }) =>
    request<{ message: string; status: string }>("/auth/register-provider", { method: "POST", body: JSON.stringify(payload) }),
  doctorStatus: () => request<{ status: "PENDING" | "APPROVED" | "REJECTED" }>("/portal/provider-status"),
  myProviders: () => request<{ providers: { provider_id: number; first_name: string; last_name: string; specialty: string; status: string }[] }>("/portal/my-providers"),
  grantProvider: (id: number) => request<{ status: string }>(`/portal/my-providers/${id}`, { method: "PUT" }),
  revokeProvider: (id: number) => request<{ status: string }>(`/portal/my-providers/${id}`, { method: "DELETE" }),
  doctorPatients: () => request<{ patients: { user_id: number; first_name: string; last_name: string; date_of_birth: string }[] }>("/portal/patients"),
  doctorPatient: (id: number) => request<{ user_id: number; first_name: string; last_name: string; date_of_birth: string }>(`/portal/patients/${id}`),
  doctorPatientMetrics: (id: number, metric: import("@/types/vitalpilot").VitalType) =>
    request<{ records: { log_id: number; recorded_at: string; metric_type: string; [key: string]: unknown }[] }>(`/portal/patients/${id}/metrics?metric_type=${metric}`),
  dailySummary: (window: { start_at: string; today_start: string; end_at: string }) =>
    request<import("./daily-summary").DailySummaryResponse>(`/daily-summary?${new URLSearchParams({ ...window, timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone })}`),
  submitVital: (metricType: import("@/types/vitalpilot").OtherVitalType, values: Record<string, number | string>) =>
    request<import("@/types/vitalpilot").OtherMetricReading>("/metrics", {
      method: "POST", body: JSON.stringify({ ...values, metric_type: metricType, ...(["SLEEP", "WATER_INTAKE", "PHYSICAL_ACTIVITY"].includes(metricType) ? { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone } : {}) }),
    }),
  getVital: (metricType: import("@/types/vitalpilot").OtherVitalType, offset = 0) =>
    request<{ count: number; records: import("@/types/vitalpilot").OtherMetricReading[] }>(`/metrics?metric_type=${metricType}&limit=20&offset=${offset}`),
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
  getCareTeam: (specialty = "") => request<{ source: string; count: number; doctors: { provider_id: number; npi: string; first_name: string; last_name: string; specialty: string; license_state: string; clinic_name: string | null; phone: string | null }[] }>(`/care-team${specialty ? `?specialty=${encodeURIComponent(specialty)}` : ""}`),
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
      if (value !== undefined && String(value).trim()) query.set(key, String(value).trim());
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
  async chat(message: string, history: ChatMessage[]): Promise<ChatResponse> {
    return request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        history,
      }),
    });
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
};
