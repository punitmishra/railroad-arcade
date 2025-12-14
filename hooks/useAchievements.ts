'use client';

// ============================================
// Achievements Hook
// ============================================
// React hook for fetching and displaying achievements

import { useState, useEffect, useCallback } from 'react';
import { useAchievementNotifications } from './useRealtime';

// ============================================
// Types
// ============================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  earned: boolean;
}

export interface AchievementStats {
  earned: number;
  total: number;
  points: number;
  maxPoints: number;
  progress: number;
}

export interface UseAchievementsReturn {
  earned: Achievement[];
  available: Achievement[];
  stats: AchievementStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  newAchievements: Achievement[];
  clearNewAchievements: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useAchievements(): UseAchievementsReturn {
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [available, setAvailable] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  // Listen for real-time achievement notifications
  const { latestAchievement, clearAchievements: clearNotifications } =
    useAchievementNotifications();

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/achievements');
      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const data = await response.json();
      if (data.success) {
        setEarned(data.data.earned);
        setAvailable(data.data.available);
        setStats(data.data.stats);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Handle real-time achievement notifications
  useEffect(() => {
    if (latestAchievement) {
      // Refresh to get the new achievement details
      fetchAchievements();

      // Find the achievement in the available list and add to new achievements
      const achievementType = latestAchievement.achievementType;
      const achievement = available.find((a) => a.id === achievementType);
      if (achievement) {
        setNewAchievements((prev) => [...prev, { ...achievement, earned: true }]);
      }
    }
  }, [latestAchievement, available, fetchAchievements]);

  // Clear new achievements
  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
    clearNotifications();
  }, [clearNotifications]);

  return {
    earned,
    available,
    stats,
    isLoading,
    error,
    refresh: fetchAchievements,
    newAchievements,
    clearNewAchievements,
  };
}

// ============================================
// Achievement Toast Component Data
// ============================================

export function formatAchievementToast(achievement: Achievement): {
  title: string;
  message: string;
  icon: string;
} {
  return {
    title: 'Achievement Unlocked!',
    message: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
    icon: achievement.icon,
  };
}
