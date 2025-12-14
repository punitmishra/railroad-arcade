import { PrismaClient } from '@prisma/client';

// Declare global type for PrismaClient
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Use singleton pattern to prevent multiple instances in development
export const db = globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

// Export types for convenience
export type {
  User,
  Account,
  Session,
  PlaySession,
  SessionEvent,
  Transaction,
  Snapshot,
  Achievement,
  QueueJob,
  LiveQueue,
  TokenAction,
  GameSession,
  Leaderboard,
  Recording
} from '@prisma/client';

export {
  PlaySessionStatus,
  SessionEventType,
  TransactionType,
  PaymentProvider,
  TransactionStatus,
  AchievementType,
  JobStatus,
  QueueStatus,
  ActionType,
  GameMode,
  RecordingStatus
} from '@prisma/client';
