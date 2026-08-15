"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionUser } from "@/lib/auth";
import { getSessionAction, loginAction, logoutAction } from "@/lib/auth-actions";

export type LoginResult = { user: SessionUser } | { error: string };

type AuthContextValue = {
  currentUser: SessionUser | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSessionAction()
      .then((session) => {
        if (cancelled) return;
        setCurrentUser(session);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const result = await loginAction(email, password);
    if ("error" in result) {
      return result;
    }
    setCurrentUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutAction();
    setCurrentUser(null);
  }, []);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated: currentUser !== null,
      isSuperAdmin: currentUser?.role === "SUPERADMIN",
      isHydrated,
      login,
      logout,
    }),
    [currentUser, isHydrated, login, logout]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const contextValue = useContext(AuthContext);
  if (!contextValue) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return contextValue;
}
