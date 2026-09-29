import { session } from './session';
import type { AuthUser } from '@/types/vitalpilot';
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
    throw new Error(
      `Request failed with status ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  async signIn(email: string, password: string): Promise<SignInResponse> {
    // The existing backend accepts query parameters, not JSON bodies.
    const query = new URLSearchParams({ email, password });
    return request<SignInResponse>(`/auth/login?${query}`, { method: 'POST' });
  },
  async signUp(firstname: string, lastname: string, email: string, password: string): Promise<SignUpResponse> {
    const query = new URLSearchParams({ firstname, lastname, email, password });
    return request<SignUpResponse>(`/auth/register?${query}`, { method: 'POST' });
  },
  me: () => request<AuthUser>('/auth/me'),
  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),

  async chat(
    message: string,
    history: ChatMessage[]
  ): Promise<ChatResponse> {
    if (!API_BASE_URL) {
      return {
        text:
          'Pilot AI is currently running in demo mode. ' +
          `You asked: "${message}"`,
      };
    }

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
    if (!API_BASE_URL) {
      return {
        success: true,
        message: 'Measurement saved in demo mode.',
      };
    }

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
