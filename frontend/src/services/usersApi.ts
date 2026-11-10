import { Platform } from 'react-native';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL = configuredApiUrl?.replace(/\/+$/, '');

export type ManagedUser = {
  _id: string;
  email: string;
  hoten: string;
  hinhanh: string;
};

export type UserInput = {
  email: string;
  hoten: string;
  matkhau?: string;
  hinhanh: string;
};

export class UsersApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'UsersApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL chưa được cấu hình.');

  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/users${path}`, {
      ...options,
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Không thể kết nối máy chủ. Hãy kiểm tra địa chỉ API và kết nối mạng.');
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new UsersApiError(response.status, typeof body.error === 'string' ? body.error : 'Yêu cầu không thành công.');
  }
  return body as T;
}

export async function listUsers(search: string, token?: string | null): Promise<ManagedUser[]> {
  const query = search.trim() ? `?q=${encodeURIComponent(search.trim())}` : '';
  const response = await request<{ users: ManagedUser[] }>(query, {}, token);
  return response.users;
}

export async function getUser(id: string, token?: string | null): Promise<ManagedUser> {
  const response = await request<{ user: ManagedUser }>(`/${encodeURIComponent(id)}`, {}, token);
  return response.user;
}

export async function createUser(input: UserInput, token?: string | null): Promise<ManagedUser> {
  const response = await request<{ user: ManagedUser }>('', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);
  return response.user;
}

export async function updateUser(id: string, input: Partial<UserInput>, token?: string | null): Promise<ManagedUser> {
  const response = await request<{ user: ManagedUser }>(`/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }, token);
  return response.user;
}

export async function deleteUser(id: string, token?: string | null): Promise<void> {
  await request<{ user: ManagedUser }>(`/${encodeURIComponent(id)}`, { method: 'DELETE' }, token);
}
