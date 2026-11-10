import { Platform } from 'react-native';
import { PickedUserImage } from './pickUserImage';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_URL = configuredApiUrl?.replace(/\/+$/, '');

export type ManagedUser = {
  _id: string;
  email: string;
  hoten: string;
  hinhanh: string;
};

export type UploadedAvatar = { url: string; publicId: string };

export type UserInput = {
  email: string;
  hoten: string;
  matkhau?: string;
  hinhanh?: string;
};

export class UsersApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'UsersApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string | null, resource = '/api/users'): Promise<T> {
  if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL chưa được cấu hình.');

  let response: Response;
  try {
    const isMultipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
    response = await fetch(`${API_URL}${resource}${path}`, {
      ...options,
      credentials: Platform.OS === 'web' ? 'include' : 'omit',
      headers: {
        ...(!isMultipart ? { 'Content-Type': 'application/json' } : {}),
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

export type EmailOtpResult = { success: true; message: string; resendAfter: string; expiresAt: string };
export type EmailOtpVerification = { success: true; verified: true; email: string };

export async function sendEmailOtp(email: string, token?: string | null): Promise<EmailOtpResult> {
  return request<EmailOtpResult>('/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }, token, '/api/auth/email');
}

export async function verifyEmailOtp(email: string, otp: string, token?: string | null): Promise<EmailOtpVerification> {
  return request<EmailOtpVerification>('/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  }, token, '/api/auth/email');
}

export async function uploadAvatar(image: PickedUserImage, token?: string | null): Promise<UploadedAvatar> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const response = await fetch(image.uri);
    if (!response.ok) throw new Error('Không thể đọc ảnh đã chọn.');
    const blob = await response.blob();
    form.append('image', blob, image.fileName);
  } else {
    form.append('image', { uri: image.uri, name: image.fileName, type: image.mimeType } as unknown as Blob);
  }
  return request<UploadedAvatar>('/avatar', { method: 'POST', body: form }, token);
}

export async function deleteUploadedAvatar(publicId: string, token?: string | null): Promise<void> {
  await request<{ success: boolean }>('/avatar', { method: 'DELETE', body: JSON.stringify({ publicId }) }, token);
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
