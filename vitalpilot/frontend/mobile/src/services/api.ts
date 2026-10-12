import { session } from './session';
import type { AuthUser, QuestionnaireRequest, Doctor } from '@/types/vitalpilot';
import type {
    ChatMessage,
    ChatResponse,
    MetricSubmissionResponse,
    SignInResponse,
    SignUpResponse,
  } from '@/types/vitalpilot';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, '');

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is not configured.'
    );
  }

  const token = await session.get();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let response: Response;
  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        signal: controller.signal,
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      }
    );

  } catch {
    throw new Error('Cannot reach the server. Check your connection and mobile API URL.');
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (typeof body?.detail === 'string') throw new Error(body.detail);
    if (Array.isArray(body?.detail)) throw new Error(body.detail.map((item: { loc?: string[]; msg?: string }) => `${item.loc?.slice(1).join('.') || 'Request'}: ${item.msg || 'Invalid value'}`).join('\n'));
    throw new Error(
      `Request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  clinicPhoto: (npi: string) => request<import('@/types/vitalpilot').ClinicPhoto>(`/doctors/${encodeURIComponent(npi)}/clinic-photo`),
  signInWithGoogle: (idToken: string) => request<SignInResponse & { is_new_user: boolean }>('/auth/google', {
    method: 'POST', body: JSON.stringify({ id_token: idToken }),
  }),
  async signIn(email: string, password: string): Promise<SignInResponse> {
    return request<SignInResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },
  async signUp(firstname: string, lastname: string, email: string, password: string): Promise<SignUpResponse> {
    return request<SignUpResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ firstname, lastname, email, password }) });
  },
  saveQuestionnaire: (payload: QuestionnaireRequest) => request<{ message: string }>('/auth/questionnare', { method: 'POST', body: JSON.stringify(payload) }),
  searchDoctors: (filters: { specialty?: string; city?: string; state?: string; gender?: string }) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) if (value?.trim()) query.set(key, value.trim());
    return request<{ count: number; doctors: Doctor[] }>(`/doctors/search?${query}`);
  },
  me: () => request<AuthUser>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  async chat(
    message: string,
    history: ChatMessage[]
  ): Promise<ChatResponse> {
    return request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
      }),
    });
  },

  async submitMetric(
    metricType: string,
    value: string
  ): Promise<MetricSubmissionResponse> {
    return request<MetricSubmissionResponse>(
      '/metrics',
      {
        method: 'POST',
        body: JSON.stringify({
          metricType,
          value,
          timestamp: new Date().toISOString(),
        }),
      }
    );
  },
};
