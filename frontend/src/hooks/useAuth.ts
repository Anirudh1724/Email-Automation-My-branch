import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { Profile } from "@/types/database";

interface User {
  id: string;
  email: string;
}

interface AuthError {
  message: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const userData = await api.getMe();
      setUser({ id: userData.id, email: userData.email });
      // Map backend fields to Profile type
      setProfile({
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name || null,
        company: userData.company || null,
        timezone: userData.timezone || "America/New_York",
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      } as Profile);
    } catch (error) {
      // Token invalid, clear it
      localStorage.removeItem("access_token");
      api.setToken(null);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    // Check for stored token and fetch user
    const token = localStorage.getItem("access_token");
    if (token) {
      api.setToken(token);
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [initialized, fetchUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true);
      const result = await api.login(email, password);
      localStorage.setItem("access_token", result.access_token);
      api.setToken(result.access_token);
      await fetchUser();
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: { message: (error as Error).message } };
    }
  }, [fetchUser]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true);
      const result = await api.register(email, password, fullName);
      if (result.access_token) {
        localStorage.setItem("access_token", result.access_token);
        api.setToken(result.access_token);
        await fetchUser();
      }
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: { message: (error as Error).message } };
    }
  }, [fetchUser]);

  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    try {
      await api.logout();
    } catch (error) {
      // Ignore logout errors
    }
    localStorage.removeItem("access_token");
    api.setToken(null);
    setUser(null);
    setProfile(null);
    return { error: null };
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<{ error: AuthError | null }> => {
    try {
      await api.updateProfile(updates);
      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      return { error: null };
    } catch (error) {
      return { error: { message: (error as Error).message } };
    }
  }, []);

  const updatePassword = useCallback(async (password: string): Promise<{ error: AuthError | null }> => {
    try {
      await api.updatePassword(password);
      return { error: null };
    } catch (error) {
      return { error: { message: (error as Error).message } };
    }
  }, []);

  // Memoize session object to prevent re-renders
  const session = useMemo(() => {
    return user ? { access_token: api.getToken() } : null;
  }, [user]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
  }), [user, session, profile, loading, signIn, signUp, signOut, updateProfile, updatePassword]);
}
