export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export type AuthUser = {
  user_id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: 'patient' | 'provider' | 'admin';
  created_at: string;
};

export type SignInResponse = {
  message: string;
  access_token: string;
  user: AuthUser;
};

export type SignUpResponse = {
  message: string;
  user: AuthUser;
};

export type ChatResponse = {
  text: string;
};

export type MetricSubmissionResponse = {
  success: boolean;
  message?: string;
};