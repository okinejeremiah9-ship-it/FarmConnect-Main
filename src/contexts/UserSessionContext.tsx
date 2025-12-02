// src/contexts/UserSessionContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

interface UserSessionContextValue {
  /** Profile row from your `users` table (business_name, role, etc.) */
  user: any | null;
  /** Raw Supabase auth user (email, phone, metadata, etc.) */
  authUser: any | null;
  /** Supabase session (has access_token, refresh_token, expiry, etc.) */
  session: any | null;
  /** True while we are checking Supabase for an existing session on app load */
  initializing: boolean;

  /** Manually set/override the merged profile (if needed) */
  setUser: (nextUser: any | null) => void;

  /** Fetch latest profile from Edge Function + merge into context */
  refreshUser: (userId: string, fallback?: any | null) => Promise<any | null>;

  /** Update profile in `users` table and sync into context */
  updateProfile: (updates: Record<string, any>) => Promise<void>;

  /** Clear local profile + effectively log user out of app state */
  clearUser: () => void;
}

const UserSessionContext = createContext<UserSessionContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "user_profile";

// --------------------------------------
// Read stored profile safely from localStorage
// --------------------------------------
const readStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("⚠️ Failed to parse stored user profile:", err);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<any | null>(() => readStoredUser());
  const [session, setSession] = useState<any | null>(null);
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [initializing, setInitializing] = useState(true);

  // -------------------------------------------------
  // Persist profile (NOT tokens) into localStorage
  // -------------------------------------------------
  const persistUser = useCallback((nextUser: any | null) => {
    setUserState(nextUser);
    if (typeof window === "undefined") return;

    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearUser = useCallback(() => {
    persistUser(null);
    setSession(null);
    setAuthUser(null);
  }, [persistUser]);

  // -------------------------------------------------
  // Fetch user profile from Edge Function & merge
  // -------------------------------------------------
  const refreshUser = useCallback(
    async (userId: string, fallback: any | null = null) => {
      if (!userId) return fallback ?? null;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${userId}`,
          {
            method: "GET",
            headers: {
              // Uses anon key to call your Edge Function, which internally uses SERVICE ROLE
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch user profile");
        }

        const mergedProfile = { ...(fallback ?? {}), ...data.user };
        persistUser(mergedProfile);
        return mergedProfile;
      } catch (error) {
        console.error("❌ Failed to refresh user profile:", error);

        if (fallback) persistUser(fallback);
        return fallback ?? null;
      }
    },
    [persistUser]
  );

  // -------------------------------------------------
  // Update profile in DB (users table)
  // -------------------------------------------------
  const updateProfile = useCallback(
    async (updates: Record<string, any>) => {
      if (!user?.id) {
        console.warn("Cannot update profile: user not set.");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;

        const merged = { ...user, ...data };
        persistUser(merged);

        console.log("✅ Profile updated successfully");
      } catch (err) {
        console.error("❌ Profile update failed:", err);
        throw err;
      }
    },
    [user, persistUser]
  );

  // -------------------------------------------------
  // On app load: verify Supabase session & sync profile
  // Also listen for auth state changes (login / logout / refresh)
  // -------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session ?? null);
      setAuthUser(session?.user ?? null);

      if (session?.user) {
        // If we don't have profile or it's from a different user → fetch fresh
        if (!user || user.id !== session.user.id) {
          await refreshUser(session.user.id, user);
        }
      } else {
        clearUser();
      }

      setInitializing(false);
    };

    // Listen to auth changes (signIn, signOut, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      setAuthUser(newSession?.user ?? null);

      if (newSession?.user) {
        await refreshUser(newSession.user.id);
      } else {
        clearUser();
      }
    });

    init();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // NOTE: refreshUser & clearUser are stable (useCallback),
    // user is intentionally NOT added here to avoid re-subscribing
    // on every profile change.
  }, [refreshUser, clearUser]);

  // -------------------------------------------------
  // Context value exposed to components
  // -------------------------------------------------
  const value = useMemo(
    () => ({
      user,
      authUser,
      session,
      initializing,
      setUser: persistUser,
      refreshUser,
      updateProfile,
      clearUser,
    }),
    [user, authUser, session, initializing, persistUser, refreshUser, updateProfile, clearUser]
  );

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = () => {
  const context = useContext(UserSessionContext);
  if (!context)
    throw new Error("useUserSession must be used within a UserSessionProvider");
  return context;
};
