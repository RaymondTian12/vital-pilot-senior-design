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
};
