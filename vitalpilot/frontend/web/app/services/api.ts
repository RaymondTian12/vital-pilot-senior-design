export interface AuthUser {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  user: AuthUser;
}

export interface Doctor {
  npi: string;
  first_name: string;
  last_name: string;
  gender: string;
  specialty: string;
  city: string;
  state: string;
  phone: string;
  address: string;
}

export interface DoctorSearchParams {
  specialty?: string;
  city?: string;
  state?: string;
  gender?: string;
}

export interface CareTeamProvider {
  provider_id: number;
  npi: string;
  first_name: string;
  last_name: string;
  specialty: string;
  license_state: string;
  clinic_name: string | null;
  phone: string | null;
}

export interface MetricReading {
  log_id: number;
  metric_type: string;
  recorded_at: string;
  classification?: Record<string, unknown> | null;
  [field: string]: unknown;
}

export interface DailySummaryResult {
  status: "urgent" | "needs_review" | "incomplete" | "no_alerts";
  title: string;
  message: string;
  urgent_readings: Array<{ metric_type: string; log_id: number; recorded_at: string; classification: string }>;
  warning_readings: Array<{ metric_type: string; log_id: number; recorded_at: string; classification: string }>;
  unclassified_readings: Array<{ metric_type: string; log_id: number; recorded_at: string; classification: string }>;
  missing_health_metrics: string[];
  habit_goals_met: number;
  habit_goals_below: number;
  habit_goals_unknown: number;
  logged_metric_count: number;
}

export interface DailySummaryResponse {
  overall_result: DailySummaryResult;
  records: MetricReading[];
  goals: Record<string, number>;
  truncated_metrics: string[];
  start_at: string;
  today_start: string;
  end_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function demoUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    user_id: 0,
    firstname: "Demo",
    lastname: "User",
    email: "demo@example.com",
    role: "patient",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const DEMO_DOCTORS: Doctor[] = [
  {
    npi: "0000000001",
    first_name: "Alex",
    last_name: "Rivera",
    gender: "F",
    specialty: "Cardiovascular Disease",
    city: "Arlington",
    state: "TX",
    phone: "555-010-0001",
    address: "100 Demo Way",
  },
  {
    npi: "0000000002",
    first_name: "Sam",
    last_name: "Chen",
    gender: "M",
    specialty: "Nephrology",
    city: "Arlington",
    state: "TX",
    phone: "555-010-0002",
    address: "200 Demo Way",
  },
];

const DEMO_CARE_TEAM: CareTeamProvider[] = [
  {
    provider_id: 1,
    npi: "0000000001",
    first_name: "Alex",
    last_name: "Rivera",
    specialty: "Cardiology",
    license_state: "TX",
    clinic_name: "Demo Cardiology Associates",
    phone: "555-010-0001",
  },
  {
    provider_id: 2,
    npi: "0000000002",
    first_name: "Sam",
    last_name: "Chen",
    specialty: "Primary care",
    license_state: "TX",
    clinic_name: "Demo Family Practice",
    phone: "555-010-0002",
  },
];

function demoDailySummary(): DailySummaryResponse {
  const now = new Date().toISOString();
  return {
    overall_result: {
      status: "no_alerts",
      title: "No alerts in assessed health readings",
      message: "This is demo data. Sign in to see your real daily summary.",
      urgent_readings: [],
      warning_readings: [],
      unclassified_readings: [],
      missing_health_metrics: [],
      habit_goals_met: 1,
      habit_goals_below: 0,
      habit_goals_unknown: 0,
      logged_metric_count: 1,
    },
    records: [],
    goals: {},
    truncated_metrics: [],
    start_at: now,
    today_start: now,
    end_at: now,
  };
}

export const api = {
  isDemoMode(): boolean {
    return !API_BASE_URL;
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (!API_BASE_URL) {
      return {
        message: "Login successful (demo mode)",
        access_token: "demo-token",
        user: demoUser({ email }),
      };
    }

    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async signUp(
    firstname: string,
    lastname: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    if (!API_BASE_URL) {
      return {
        message: "Registration successful (demo mode)",
        access_token: "demo-token",
        user: demoUser({ firstname, lastname, email }),
      };
    }

    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ firstname, lastname, email, password }),
    });
  },

  async getMe(): Promise<AuthUser | null> {
    if (!API_BASE_URL) {
      // Demo mode never had a real session to check; treat dashboard access
      // as open, matching today's unguarded behavior.
      return null;
    }

    try {
      return await request<AuthUser>("/auth/me");
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    if (!API_BASE_URL) {
      return;
    }

    await request("/auth/logout", { method: "POST" });
  },

  async searchDoctors(params: DoctorSearchParams): Promise<Doctor[]> {
    if (!API_BASE_URL) {
      return DEMO_DOCTORS.filter((doctor) => {
        if (params.specialty && doctor.specialty !== params.specialty) {
          return false;
        }
        if (params.gender && doctor.gender !== params.gender) {
          return false;
        }
        return true;
      });
    }

    const query = new URLSearchParams();
    if (params.specialty) query.set("specialty", params.specialty);
    if (params.city) query.set("city", params.city);
    if (params.state) query.set("state", params.state);
    if (params.gender) query.set("gender", params.gender);

    const result = await request<{ count: number; doctors: Doctor[] }>(
      `/doctors/search?${query.toString()}`
    );
    return result.doctors;
  },

  async getCareTeam(specialty?: string, limit = 5): Promise<CareTeamProvider[]> {
    if (!API_BASE_URL) {
      return DEMO_CARE_TEAM;
    }

    const query = new URLSearchParams();
    if (specialty) query.set("specialty", specialty);
    query.set("limit", String(limit));

    const result = await request<{ count: number; doctors: CareTeamProvider[] }>(
      `/care-team?${query.toString()}`
    );
    return result.doctors;
  },

  async getDailySummary(): Promise<DailySummaryResponse> {
    if (!API_BASE_URL) {
      return demoDailySummary();
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const query = new URLSearchParams({
      start_at: todayStart.toISOString(),
      today_start: todayStart.toISOString(),
      end_at: now.toISOString(),
    });

    return request<DailySummaryResponse>(`/daily-summary?${query.toString()}`);
  },
};
