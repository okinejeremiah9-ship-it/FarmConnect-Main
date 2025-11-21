// src/contexts/UserSessionContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";

interface UserSessionContextValue {
  user: any | null;
  initializing: boolean;
  setUser: (nextUser: any | null) => void;
  refreshUser: (userId: string, fallback?: any | null) => Promise<any | null>;
  updateProfile: (updates: Record<string, any>) => Promise<void>;
  clearUser: () => void;
}

const UserSessionContext = createContext<UserSessionContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "user_profile";

// Read from local storage safely
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
  const [initializing, setInitializing] = useState(true);

  // Save user to localStorage
  const persistUser = useCallback((nextUser: any | null) => {
    setUserState(nextUser);
    if (typeof window === "undefined") return;
    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearUser = useCallback(() => persistUser(null), [persistUser]);

  // ----------------------------------------------------
  // 🔥 Fetch & Merge Supabase user profile
  // ----------------------------------------------------
  const refreshUser = useCallback(
    async (userId: string, fallback: any | null = null) => {
      if (!userId) return fallback ?? null;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${userId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to fetch user profile");
        }

        const profile = { ...(fallback ?? {}), ...data.user };
        persistUser(profile);
        return profile;
      } catch (error) {
        console.error("❌ Failed to refresh user profile:", error);
        if (fallback) persistUser(fallback);
        return fallback ?? null;
      }
    },
    [persistUser]
  );

  // ----------------------------------------------------
  // 🔥 Update Profile
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 🔥 Auth + Profile Sync on App Load
  // ----------------------------------------------------
  useEffect(() => {
    const init = async () => {
      // 1️⃣ Get Supabase auth session
      const { data: auth } = await supabase.auth.getSession();

      if (auth?.session?.user) {
        const authUser = auth.session.user;

        // 2️⃣ If stored user differs, fetch latest
        if (!user || user.id !== authUser.id) {
          await refreshUser(authUser.id, user);
        }
      } else {
        // 3️⃣ No auth session → clear local user
        clearUser();
      }

      setInitializing(false);
    };

    init();
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      setUser: persistUser,
      refreshUser,
      updateProfile,
      clearUser,
    }),
    [user, initializing, persistUser, refreshUser, updateProfile, clearUser]
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
