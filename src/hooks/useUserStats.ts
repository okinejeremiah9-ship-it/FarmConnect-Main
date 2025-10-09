import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserStats {
  activeRequests: number;
  completedServices: number;
  totalSpent: number;
  servicesUsed: number;
}

interface UseUserStatsReturn {
  stats: UserStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

export const useUserStats = (userId: string | undefined): UseUserStatsReturn => {
  const { logout } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    activeRequests: 0,
    completedServices: 0,
    totalSpent: 0,
    servicesUsed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-stats/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch stats';
      
      // If user not found, logout to clear invalid session
      if (errorMessage === 'User not found') {
        logout();
        return;
      }
      
      setError(errorMessage);
      // Keep default stats on error
      setStats({
        activeRequests: 0,
        completedServices: 0,
        totalSpent: 0,
        servicesUsed: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
  };
};