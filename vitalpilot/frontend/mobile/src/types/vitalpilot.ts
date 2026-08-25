export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export type SignInResponse = {
  success: boolean;
  token?: string;
  message?: string;
};

export type SignUpResponse = {
  success: boolean;
  userId?: string;
  message?: string;
};

export type ChatResponse = {
  text: string;
};

export type MetricSubmissionResponse = {
  success: boolean;
  message?: string;
};