import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import {
  AdminIdentity,
  ApiError,
  getAdminSession,
  loginAdmin as loginRequest,
  logoutAdmin as logoutRequest,
} from '../services/adminAuthApi';
import { getAdminToken, removeAdminToken, saveAdminToken } from '../services/tokenStorage';

type AdminAuthContextValue = {
  admin: AdminIdentity | null;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: PropsWithChildren) {
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      let token: string | null = null;
      try {
        if (Platform.OS !== 'web') token = await getAdminToken();
        if (Platform.OS === 'web' || token) {
          const session = await getAdminSession(token ?? undefined);
          if (active) setAdmin(session.admin);
        }
      } catch (error) {
        if (token && error instanceof ApiError && error.status === 401) {
          await removeAdminToken().catch(() => undefined);
        }
        if (active) setAdmin(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  async function login(email: string, password: string) {
    const result = await loginRequest(email, password);
    if (Platform.OS !== 'web') {
      if (!result.token) throw new Error('The backend did not return an Admin session token.');
      await saveAdminToken(result.token);
    }
    setAdmin(result.admin);
  }

  async function logout() {
    const token = Platform.OS === 'web' ? undefined : await getAdminToken().catch(() => null);
    try {
      await logoutRequest(token ?? undefined);
    } catch {
      // Clear local state even when the network is unavailable.
    }
    await removeAdminToken().catch(() => undefined);
    setAdmin(null);
  }

  const value = useMemo(() => ({ admin, isLoading, login, logout }), [admin, isLoading]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used inside AdminAuthProvider.');
  return context;
}
