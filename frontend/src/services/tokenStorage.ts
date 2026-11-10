import * as SecureStore from 'expo-secure-store';

const ADMIN_TOKEN_KEY = 'admin-jwt';

export function getAdminToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ADMIN_TOKEN_KEY);
}

export function saveAdminToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(ADMIN_TOKEN_KEY, token);
}

export function removeAdminToken(): Promise<void> {
  return SecureStore.deleteItemAsync(ADMIN_TOKEN_KEY);
}
