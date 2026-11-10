import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL = configuredApiUrl?.replace(/\/+$/, '');

export type AdminIdentity = { email: string };

type LoginResponse = {
  admin: AdminIdentity;
  token?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured. See frontend/.env.example.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Cannot reach the backend. Check the API address and network connection.');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : 'The request failed.';
    throw new ApiError(response.status, message);
  }
  return body as T;
}

export async function loginAdmin(email: string, password: string): Promise<LoginResponse> {
  const transport = Platform.OS === 'web' ? 'cookie' : 'bearer';
  return request<LoginResponse>('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'X-Auth-Transport': transport },
    body: JSON.stringify({ email, password }),
  });
}

export async function getAdminSession(token?: string): Promise<{ admin: AdminIdentity }> {
  return request('/api/auth/admin/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function logoutAdmin(token?: string): Promise<void> {
  await request('/api/auth/admin/logout', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
