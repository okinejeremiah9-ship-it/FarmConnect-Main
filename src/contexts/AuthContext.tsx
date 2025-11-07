import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { normalizeUserProfile } from "../utils/profile";
import {
  AuthState,
  LoginCredentials,
  RegisterData,
  User,
} from "../types/auth";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  /**
   * Normalized setter exposed to consumers so profile updates propagate globally.
   */
  setUser: (
    value: User | Record<string, any> | null | ((prev: any | null) => any | null)
  ) => void;
  /**
   * Forces a Supabase refetch of the authenticated user profile and updates the cache.
   */
  refreshUserProfile: (userId?: string) => Promise<void>;
  /**
   * Convenience alias for UI components that expect `loading` instead of `isLoading`.
   */
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const latestUserRef = useRef<any | null>(null);

  const persistUser = useCallback((value: any | null) => {
    if (value) {
      localStorage.setItem("user", JSON.stringify(value));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("pendingUser");
    }
  }, []);

  const setUser = useCallback(
    (
      value:
        | User
        | Record<string, any>
        | null
        | ((prev: any | null) => any | null),
    ) => {
      setAuthState((prev) => {
        const nextValue =
          typeof value === "function"
            ? (value as (prev: any | null) => any | null)(prev.user)
            : value;
        const normalized = normalizeUserProfile(nextValue ?? null);

        persistUser(normalized);
        latestUserRef.current = normalized ?? null;

        return {
          ...prev,
          user: normalized ?? null,
          isAuthenticated: Boolean(normalized),
        };
      });
    },
    [persistUser],
  );

  const loadUserProfile = useCallback(
    async (userId: string, baseUser?: Record<string, any> | null) => {
      if (!userId) {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        setUser(null);
        return;
      }

      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }));

        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        const mergedProfile = {
          ...(baseUser ?? {}),
          ...(data ?? {}),
        };

        setUser(mergedProfile);
      } catch (error) {
        console.error("Failed to load user profile:", error);

        if (baseUser) {
          setUser(baseUser);
        } else {
          setUser(null);
        }
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [setUser],
  );

  const refreshUserProfile = useCallback(
    async (userId?: string) => {
      const targetId = userId ?? latestUserRef.current?.id;
      if (!targetId) {
        return;
      }

      const baseUser = latestUserRef.current ?? undefined;
      await loadUserProfile(targetId, baseUser ?? undefined);
    },
    [loadUserProfile],
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateFromStorage = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setUser(null);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.warn("Failed to parse stored user, clearing cache.", error);
        localStorage.removeItem("user");
        setUser(null);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    const syncInitialSession = async () => {
      try {
        setAuthState((prev) => ({ ...prev, isLoading: true }));
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (error) {
          console.error("Failed to retrieve Supabase session:", error);
        }

        if (session?.user?.id) {
          const baseUser = {
            ...session.user,
            ...(session.user.user_metadata ?? {}),
          };
          await loadUserProfile(session.user.id, baseUser);
        } else {
          hydrateFromStorage();
        }
      } catch (error) {
        console.error("Initial session hydration failed:", error);
        hydrateFromStorage();
      }
    };

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) {
          return;
        }

        if (session?.user?.id) {
          const baseUser = {
            ...session.user,
            ...(session.user.user_metadata ?? {}),
          };

          await loadUserProfile(session.user.id, baseUser);
        } else {
          setUser(null);
          setAuthState((prev) => ({ ...prev, isLoading: false }));
        }
      },
    );

    syncInitialSession();

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [loadUserProfile, setUser]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      try {
        // Placeholder auth implementation retained for legacy consumers.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockUser: User = {
          id:
            credentials.email === "farmer@test.com"
              ? "550e8400-e29b-41d4-a716-446655440001"
              : credentials.email === "provider@test.com"
              ? "550e8400-e29b-41d4-a716-446655440002"
              : credentials.email === "admin@test.com"
              ? "550e8400-e29b-41d4-a716-446655440003"
              : crypto.randomUUID(),
          email: credentials.email,
          name:
            credentials.email === "farmer@test.com"
              ? "John Farmer"
              : credentials.email === "provider@test.com"
              ? "Jane Provider"
              : credentials.email === "admin@test.com"
              ? "Admin User"
              : "New User",
          phone: "+233123456789",
          role:
            credentials.email === "farmer@test.com"
              ? "farmer"
              : credentials.email === "provider@test.com"
              ? "provider"
              : credentials.email === "admin@test.com"
              ? "admin"
              : "farmer",
          isVerified: true,
          createdAt: new Date().toISOString(),
        };

        setUser(mockUser);
      } catch (error) {
        console.error("Login failed:", error);
        setAuthState((prev) => ({ ...prev, isLoading: false }));
        throw new Error("Login failed");
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [setUser],
  );

  const register = useCallback(
    async (data: RegisterData) => {
      setAuthState((prev) => ({ ...prev, isLoading: true }));

      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newUser: User = {
          id: crypto.randomUUID(),
          email: data.email,
          name: data.name,
          phone: data.phone,
          role: data.role,
          isVerified: false,
          createdAt: new Date().toISOString(),
        };

        localStorage.setItem("pendingUser", JSON.stringify(newUser));
      } finally {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [],
  );

  const verifyOTP = useCallback(async (otp: string) => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (otp !== "123456") {
        throw new Error("Invalid OTP");
      }

      const pendingUser = localStorage.getItem("pendingUser");
      if (pendingUser) {
        const user = { ...JSON.parse(pendingUser), isVerified: true };
        setUser(user);
        localStorage.removeItem("pendingUser");
      }
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Supabase sign out failed:", error);
    } finally {
      setUser(null);
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [setUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      ...authState,
      login,
      register,
      logout,
      verifyOTP,
      setUser,
      refreshUserProfile,
      loading: authState.isLoading,
    }),
    [authState, login, logout, refreshUserProfile, register, setUser, verifyOTP],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};