// ============================================
// Achievement System
// ============================================
// Tracks and awards achievements based on user actions

import { db } from './db';
import { emitAchievement } from './realtime';

// ============================================
// Achievement Definitions
// ============================================

export type AchievementType =
  | 'FIRST_RUN'
  | 'SPEED_DEMON'
  | 'NIGHT_OWL'
  | 'COLLECTOR'
  | 'MARATHON'
  | 'EXPLORER'
  | 'PHOTOGRAPHER'
  | 'CONDUCTOR'
  | 'MASTER_ENGINEER'
  | 'VETERAN';

export interface AchievementDefinition {
  id: AchievementType;
  name: string;
  description: string;
  icon: string;
  points: number;
  secret?: boolean;
}

export const ACHIEVEMENTS: Record<AchievementType, AchievementDefinition> = {
  FIRST_RUN: {
    id: 'FIRST_RUN',
    name: 'First Steps',
    description: 'Complete your first play session',
    icon: '🚂',
    points: 10,
  },
  SPEED_DEMON: {
    id: 'SPEED_DEMON',
    name: 'Speed Demon',
    description: 'Run a train at maximum speed for 60 seconds',
    icon: '⚡',
    points: 25,
  },
  NIGHT_OWL: {
    id: 'NIGHT_OWL',
    name: 'Night Owl',
    description: 'Play during night mode for 10 minutes',
    icon: '🌙',
    points: 15,
  },
  COLLECTOR: {
    id: 'COLLECTOR',
    name: 'Collector',
    description: 'Unlock all interactive modules',
    icon: '🎯',
    points: 50,
  },
  MARATHON: {
    id: 'MARATHON',
    name: 'Marathon Runner',
    description: 'Complete 100 laps total',
    icon: '🏃',
    points: 30,
  },
  EXPLORER: {
    id: 'EXPLORER',
    name: 'Explorer',
    description: 'Use all camera views in a single session',
    icon: '🔭',
    points: 15,
  },
  PHOTOGRAPHER: {
    id: 'PHOTOGRAPHER',
    name: 'Photographer',
    description: 'Take 10 snapshots',
    icon: '📸',
    points: 20,
  },
  CONDUCTOR: {
    id: 'CONDUCTOR',
    name: 'Conductor',
    description: 'Operate all three trains simultaneously',
    icon: '👨‍✈️',
    points: 25,
  },
  MASTER_ENGINEER: {
    id: 'MASTER_ENGINEER',
    name: 'Master Engineer',
    description: 'Score 10,000 points in any game mode',
    icon: '🏆',
    points: 100,
  },
  VETERAN: {
    id: 'VETERAN',
    name: 'Veteran',
    description: 'Complete 50 play sessions',
    icon: '🎖️',
    points: 75,
  },
};

// ============================================
// Achievement Checking Functions
// ============================================

export interface AchievementContext {
  userId: string;
  sessionId?: string;
  laps?: number;
  score?: number;
  duration?: number;
  trainsOperated?: string[];
  camerasUsed?: string[];
  snapshotCount?: number;
  modulesUnlocked?: string[];
  nightModeTime?: number;
  maxSpeedTime?: number;
  totalSessions?: number;
}

/**
 * Check if an achievement should be awarded
 */
export async function checkAchievement(
  type: AchievementType,
  context: AchievementContext
): Promise<boolean> {
  const { userId } = context;

  // Check if already earned
  const existing = await db.achievement.findUnique({
    where: {
      userId_type: { userId, type },
    },
  });

  if (existing) {
    return false; // Already earned
  }

  // Check conditions
  const conditionMet = checkAchievementCondition(type, context);

  if (conditionMet) {
    await awardAchievement(userId, type);
    return true;
  }

  return false;
}

/**
 * Check if achievement conditions are met
 */
function checkAchievementCondition(
  type: AchievementType,
  context: AchievementContext
): boolean {
  switch (type) {
    case 'FIRST_RUN':
      return context.totalSessions !== undefined && context.totalSessions >= 1;

    case 'SPEED_DEMON':
      return context.maxSpeedTime !== undefined && context.maxSpeedTime >= 60;

    case 'NIGHT_OWL':
      return context.nightModeTime !== undefined && context.nightModeTime >= 600;

    case 'COLLECTOR':
      const allModules = ['trains', 'scenery', 'police', 'fire', 'ambient'];
      return allModules.every((m) => context.modulesUnlocked?.includes(m));

    case 'MARATHON':
      return context.laps !== undefined && context.laps >= 100;

    case 'EXPLORER':
      const allCameras = ['overhead', 'station-gc', 'station-vs', 'tunnel'];
      return allCameras.every((c) => context.camerasUsed?.includes(c));

    case 'PHOTOGRAPHER':
      return context.snapshotCount !== undefined && context.snapshotCount >= 10;

    case 'CONDUCTOR':
      return context.trainsOperated !== undefined && context.trainsOperated.length >= 3;

    case 'MASTER_ENGINEER':
      return context.score !== undefined && context.score >= 10000;

    case 'VETERAN':
      return context.totalSessions !== undefined && context.totalSessions >= 50;

    default:
      return false;
  }
}

/**
 * Award an achievement to a user
 */
export async function awardAchievement(
  userId: string,
  type: AchievementType
): Promise<void> {
  const achievement = await db.achievement.create({
    data: {
      userId,
      type,
    },
  });

  // Emit real-time event
  emitAchievement({
    userId,
    achievementType: type,
    earnedAt: achievement.earnedAt.toISOString(),
  });

  console.log(`Achievement awarded: ${type} to user ${userId}`);
}

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string): Promise<{
  earned: AchievementType[];
  unearned: AchievementType[];
  totalPoints: number;
}> {
  const earned = await db.achievement.findMany({
    where: { userId },
    select: { type: true },
  });

  const earnedTypes = earned.map((a) => a.type as AchievementType);
  const allTypes = Object.keys(ACHIEVEMENTS) as AchievementType[];
  const unearned = allTypes.filter((t) => !earnedTypes.includes(t));

  const totalPoints = earnedTypes.reduce(
    (sum, type) => sum + ACHIEVEMENTS[type].points,
    0
  );

  return { earned: earnedTypes, unearned, totalPoints };
}

/**
 * Get achievement details
 */
export function getAchievementDetails(type: AchievementType): AchievementDefinition {
  return ACHIEVEMENTS[type];
}

// ============================================
// Achievement Triggers
// ============================================

/**
 * Trigger achievement checks after a session ends
 */
export async function triggerSessionEndAchievements(
  userId: string,
  sessionData: {
    laps: number;
    score: number;
    duration: number;
    trainsOperated: string[];
    camerasUsed: string[];
  }
): Promise<AchievementType[]> {
  const awarded: AchievementType[] = [];

  // Get user stats
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      totalSessions: true,
      unlockedModules: true,
      snapshots: { select: { id: true } },
    },
  });

  if (!user) return awarded;

  const context: AchievementContext = {
    userId,
    laps: sessionData.laps,
    score: sessionData.score,
    duration: sessionData.duration,
    trainsOperated: sessionData.trainsOperated,
    camerasUsed: sessionData.camerasUsed,
    totalSessions: user.totalSessions,
    modulesUnlocked: user.unlockedModules,
    snapshotCount: user.snapshots.length,
  };

  // Check all achievements
  const achievementsToCheck: AchievementType[] = [
    'FIRST_RUN',
    'MARATHON',
    'EXPLORER',
    'CONDUCTOR',
    'MASTER_ENGINEER',
    'VETERAN',
    'COLLECTOR',
    'PHOTOGRAPHER',
  ];

  for (const type of achievementsToCheck) {
    const wasAwarded = await checkAchievement(type, context);
    if (wasAwarded) {
      awarded.push(type);
    }
  }

  return awarded;
}

/**
 * Trigger achievement check for speed demon (called periodically during session)
 */
export async function checkSpeedDemonProgress(
  userId: string,
  maxSpeedTime: number
): Promise<boolean> {
  return checkAchievement('SPEED_DEMON', { userId, maxSpeedTime });
}

/**
 * Trigger achievement check for night owl (called periodically during session)
 */
export async function checkNightOwlProgress(
  userId: string,
  nightModeTime: number
): Promise<boolean> {
  return checkAchievement('NIGHT_OWL', { userId, nightModeTime });
}
