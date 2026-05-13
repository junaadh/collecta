"use client";

import {
  COLLECTA_AUTH_CHANGED_EVENT,
  COLLECTA_UNAUTHORIZED_EVENT,
  collecta,
  type LoginRequest,
  type SessionUser,
} from "@/lib/api";
import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthContextType = {
  user: SessionUser | null;
  isLoading: boolean;
  login: (body: LoginRequest) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Only fetch identity — never redirect. Middleware owns all routing.
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await collecta.me();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []); // stable — no pathname/router deps

  // Fetch once on mount
  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      void refreshUser().finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  // Global unauthorized / auth-changed events
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      if (window.location.pathname !== "/login") {
        router.replace("/login");
      }
    };
    const handleAuthChanged = () => {
      void refreshUser();
    };

    window.addEventListener(COLLECTA_UNAUTHORIZED_EVENT, handleUnauthorized);
    window.addEventListener(COLLECTA_AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      window.removeEventListener(
        COLLECTA_UNAUTHORIZED_EVENT,
        handleUnauthorized,
      );
      window.removeEventListener(
        COLLECTA_AUTH_CHANGED_EVENT,
        handleAuthChanged,
      );
    };
  }, [refreshUser, router]);

  // No focus listener — middleware re-validates the cookie on every request.
  // A focus re-fetch just races with in-flight navigations on mobile.

  const login = useCallback(async (body: LoginRequest) => {
    const response = await collecta.login(body);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await collecta.logout();
    } finally {
      setUser(null);
      router.replace("/login");
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
