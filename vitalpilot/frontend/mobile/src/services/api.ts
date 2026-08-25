import type {
    ChatMessage,
    ChatResponse,
    MetricSubmissionResponse,
    SignInResponse,
    SignUpResponse,
  } from '@/types/vitalpilot';
  
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  async function request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    if (!API_BASE_URL) {
      throw new Error(
        'EXPO_PUBLIC_API_BASE_URL is not configured.'
      );
    }
  
    const response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      }
    );
  
    if (!response.ok) {
      throw new Error(
        `Request failed with status ${response.status}`
      );
    }
  
    return response.json() as Promise<T>;
  }
  
  export const api = {
    async signIn(
      email: string,
      password: string
    ): Promise<SignInResponse> {
      if (!API_BASE_URL) {
        return {
          success: true,
          token: 'demo-token',
        };
      }
  
      return request<SignInResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });
    },
  
    async signUp(
      email: string,
      password: string
    ): Promise<SignUpResponse> {
      if (!API_BASE_URL) {
        return {
          success: true,
          userId: 'demo-user',
        };
      }
  
      return request<SignUpResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });
    },
  
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