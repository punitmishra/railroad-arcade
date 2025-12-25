'use client';

// ============================================
// Achievement Notifier Component
// ============================================
// Listens for new achievements and shows toast notifications
// with sound effects when achievements are unlocked.

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useAchievementNotifications } from '@/hooks/useRealtime';
import { useToast } from '@/components/ui';
import { useSounds } from '@/hooks/useSounds';
import { ACHIEVEMENTS, AchievementType } from '@/lib/achievements';

export function AchievementNotifier() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const { play: playSound } = useSounds();
  const { latestAchievement, clearAchievements } = useAchievementNotifications();
  const processedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only process if user is logged in and there's a new achievement
    if (!session?.user || !latestAchievement) return;

    // Create unique key to prevent duplicate processing
    const achievementKey = `${latestAchievement.achievementType}-${latestAchievement.earnedAt}`;

    // Skip if already processed
    if (processedRef.current.has(achievementKey)) return;
    processedRef.current.add(achievementKey);

    // Find achievement details from the Record
    const achievementType = latestAchievement.achievementType as AchievementType;
    const achievement = ACHIEVEMENTS[achievementType];

    if (achievement) {
      // Play achievement sound
      playSound('achievement');

      // Show toast notification
      addToast(
        'success',
        `🏆 Achievement Unlocked: ${achievement.icon} ${achievement.name}`,
        6000
      );
    }

    // Clear after processing
    clearAchievements();
  }, [session, latestAchievement, addToast, playSound, clearAchievements]);

  // This component doesn't render anything visible
  return null;
}
