import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface UserSessionContextValue {
  user: any | null;
  initializing: boolean;
  setUser: (nextUser: any | null) => void;
  refreshUser: (userId: string, fallback?: any | null) => Promise<any | null>;
  clearUser: () => void;
}

const UserSessionContext = createContext<UserSessionContextValue | undefined>(undefined);

const STORAGE_KEY = 'user';

const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse stored user session:', error);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<any | null>(() => readStoredUser());
  const [initializing, setInitializing] = useState(true);

  const persistUser = useCallback((nextUser: any | null) => {
    setUserState(nextUser);

    if (typeof window === 'undefined') {
      return;
    }

    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearUser = useCallback(() => {
    persistUser(null);
  }, [persistUser]);

  const refreshUser = useCallback(
    async (userId: string, fallback: any | null = null) => {
      if (!userId) {
        if (fallback) {
          persistUser(fallback);
        }
        return fallback ?? null;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-profile?id=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load profile');
        }

        const profileUser = { ...(fallback ?? {}), ...data.user };
        persistUser(profileUser);
        return profileUser;
      } catch (error) {
        console.error('Failed to refresh user profile:', error);

        if (fallback) {
          persistUser(fallback);
          return fallback;
        }

        return null;
      }
    },
    [persistUser]
  );

  useEffect(() => {
    if (!initializing) {
      return;
    }

    if (user?.id) {
      refreshUser(user.id, user).finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, [initializing, refreshUser, user]);

  const contextValue = useMemo(
    () => ({ user, initializing, setUser: persistUser, refreshUser, clearUser }),
    [user, initializing, persistUser, refreshUser, clearUser]
  );

  return (
    <UserSessionContext.Provider value={contextValue}>
      {children}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = () => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
};
