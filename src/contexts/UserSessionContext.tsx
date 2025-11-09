import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../lib/supabaseClient';

interface UserSessionContextValue {
  user: any | null;
  initializing: boolean;
  setUser: (nextUser: any | null) => void;
  refreshUser: (userId: string, fallback?: any | null) => Promise<any | null>;
  updateProfile: (updates: Record<string, any>) => Promise<void>;
  clearUser: () => void;
}

const UserSessionContext = createContext<UserSessionContextValue | undefined>(undefined);

const STORAGE_KEY = 'user_profile';

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('⚠️ Failed to parse stored user profile:', err);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<any | null>(() => readStoredUser());
  const [initializing, setInitializing] = useState(true);

  const persistUser = useCallback((nextUser: any | null) => {
    setUserState(nextUser);
    if (typeof window === 'undefined') return;
    if (nextUser) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearUser = useCallback(() => persistUser(null), [persistUser]);

  const refreshUser = useCallback(
    async (userId: string, fallback: any | null = null) => {
      if (!userId) return fallback ?? null;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;

        const profile = { ...(fallback ?? {}), ...data };
        persistUser(profile);
        return profile;
      } catch (error) {
        console.error('❌ Failed to refresh user profile:', error);
        if (fallback) persistUser(fallback);
        return fallback ?? null;
      }
    },
    [persistUser]
  );

  const updateProfile = useCallback(
    async (updates: Record<string, any>) => {
      if (!user?.id) {
        console.warn('Cannot update profile: user not set.');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;

        const merged = { ...user, ...data };
        persistUser(merged);
        console.log('✅ Profile updated successfully');
      } catch (err) {
        console.error('❌ Profile update failed:', err);
        throw err;
      }
    },
    [user, persistUser]
  );

  useEffect(() => {
    const init = async () => {
      if (user?.id) {
        await refreshUser(user.id, user);
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
    throw new Error('useUserSession must be used within a UserSessionProvider');
  return context;
};
