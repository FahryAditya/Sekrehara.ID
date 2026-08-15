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
import type { User } from "@/lib/types";
import { clearMockSession, getMockSession, loadPersistedData, saveMockSession } from "@/lib/storage";

export type LoginResult = { user: User } | { error: string };

type AuthContextValue = {
  currentUser: User | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentUser(getMockSession());
      setIsHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const login = useCallback((email: string, password: string): LoginResult => {
    const user = loadPersistedData().users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      return { error: "Email atau password salah." };
    }

    saveMockSession(user);
    setCurrentUser(user);
    return { user };
  }, []);

  const logout = useCallback(() => {
    clearMockSession();
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