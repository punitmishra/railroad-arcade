import { Client, Receiver } from '@upstash/qstash';

// Initialize QStash client
export const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
});

// Initialize receiver for webhook verification
export const qstashReceiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

// ============================================
// Job Types
// ============================================

export type JobType =
  | 'PROCESS_PAYMENT'
  | 'FULFILL_TOKENS'
  | 'ARCHIVE_SESSION'
  | 'CHECK_ACHIEVEMENTS'
  | 'SEND_EMAIL'
  | 'GENERATE_THUMBNAIL'
  | 'AGGREGATE_STATS'
  | 'TOURNAMENT_STATUS_CHECK'
  | 'TOURNAMENT_FINALIZE'
  | 'TOURNAMENT_DISTRIBUTE_PRIZES'
  | 'SESSION_CLEANUP'
  | 'SESSION_TIMEOUT_CHECK';

export interface QueueJob<T = unknown> {
  type: JobType;
  payload: T;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Job Payloads
// ============================================

export interface ProcessPaymentPayload {
  transactionId: string;
  provider: 'stripe' | 'paypal' | 'coinbase';
  externalId: string;
}

export interface FulfillTokensPayload {
  transactionId: string;
  userId: string;
  amount: number;
}

export interface ArchiveSessionPayload {
  sessionId: string;
  userId: string;
}

export interface CheckAchievementsPayload {
  userId: string;
  sessionId?: string;
  triggerEvent?: string;
}

export interface SendEmailPayload {
  to: string;
  template: 'welcome' | 'purchase_confirmation' | 'session_summary';
  data: Record<string, unknown>;
}

export interface GenerateThumbnailPayload {
  snapshotId: string;
  imageUrl: string;
}

export interface AggregateStatsPayload {
  date: string;
  type: 'daily' | 'weekly' | 'monthly';
}

export interface TournamentStatusCheckPayload {
  tournamentId?: string; // If not provided, checks all tournaments
}

export interface TournamentFinalizePayload {
  tournamentId: string;
}

export interface TournamentDistributePrizesPayload {
  tournamentId: string;
}

export interface SessionCleanupPayload {
  sessionId: string;
  userId: string;
  reason: 'timeout' | 'expired' | 'manual';
}

// ============================================
// Queue Helper Functions
// ============================================

const getBaseUrl = () => {
  // Use VERCEL_URL in production, localhost in development
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
};

export async function enqueueJob<T>(
  type: JobType,
  payload: T,
  options?: {
    delay?: number; // Delay in seconds
    retries?: number;
    userId?: string;
  }
): Promise<string> {
  const baseUrl = getBaseUrl();
  const endpoint = `${baseUrl}/api/queue/process`;

  const job: QueueJob<T> = {
    type,
    payload,
    userId: options?.userId,
    metadata: {
      enqueuedAt: Date.now(),
    },
  };

  const response = await qstash.publishJSON({
    url: endpoint,
    body: job,
    delay: options?.delay,
    retries: options?.retries ?? 3,
  });

  return response.messageId;
}

// ============================================
// Convenience Functions
// ============================================

export const queue = {
  // Process a payment after webhook received
  processPayment: async (payload: ProcessPaymentPayload) => {
    return enqueueJob('PROCESS_PAYMENT', payload);
  },

  // Fulfill tokens after payment confirmed
  fulfillTokens: async (payload: FulfillTokensPayload) => {
    return enqueueJob('FULFILL_TOKENS', payload, { userId: payload.userId });
  },

  // Archive a completed session
  archiveSession: async (payload: ArchiveSessionPayload) => {
    return enqueueJob('ARCHIVE_SESSION', payload, {
      userId: payload.userId,
      delay: 5, // 5 second delay to ensure all events are recorded
    });
  },

  // Check and award achievements
  checkAchievements: async (payload: CheckAchievementsPayload) => {
    return enqueueJob('CHECK_ACHIEVEMENTS', payload, {
      userId: payload.userId,
      delay: 2, // Small delay to batch events
    });
  },

  // Send transactional email
  sendEmail: async (payload: SendEmailPayload) => {
    return enqueueJob('SEND_EMAIL', payload);
  },

  // Generate snapshot thumbnail
  generateThumbnail: async (payload: GenerateThumbnailPayload) => {
    return enqueueJob('GENERATE_THUMBNAIL', payload);
  },

  // Aggregate daily/weekly stats
  aggregateStats: async (payload: AggregateStatsPayload) => {
    return enqueueJob('AGGREGATE_STATS', payload, {
      delay: 60, // 1 minute delay for batching
    });
  },

  // Tournament: Check and transition statuses
  checkTournamentStatus: async (payload: TournamentStatusCheckPayload = {}) => {
    return enqueueJob('TOURNAMENT_STATUS_CHECK', payload);
  },

  // Tournament: Finalize and calculate final ranks
  finalizeTournament: async (payload: TournamentFinalizePayload) => {
    return enqueueJob('TOURNAMENT_FINALIZE', payload);
  },

  // Tournament: Distribute prizes to winners
  distributePrizes: async (payload: TournamentDistributePrizesPayload) => {
    return enqueueJob('TOURNAMENT_DISTRIBUTE_PRIZES', payload, {
      delay: 5, // Small delay to ensure finalization is complete
    });
  },

  // Tournament: Schedule status check at specific time
  scheduleTournamentCheck: async (
    payload: TournamentStatusCheckPayload,
    atTime: Date
  ) => {
    const now = Date.now();
    const targetTime = atTime.getTime();
    const delaySeconds = Math.max(0, Math.floor((targetTime - now) / 1000));

    return enqueueJob('TOURNAMENT_STATUS_CHECK', payload, {
      delay: delaySeconds,
    });
  },

  // Session: Cleanup an expired/timed out session
  cleanupSession: async (payload: SessionCleanupPayload) => {
    return enqueueJob('SESSION_CLEANUP', payload, {
      userId: payload.userId,
    });
  },

  // Session: Check all sessions for timeout (scheduled job)
  checkSessionTimeouts: async () => {
    return enqueueJob('SESSION_TIMEOUT_CHECK', {});
  },

  // Session: Schedule timeout check (run periodically)
  scheduleSessionTimeoutCheck: async (delaySeconds: number = 30) => {
    return enqueueJob('SESSION_TIMEOUT_CHECK', {}, {
      delay: delaySeconds,
    });
  },
};

// ============================================
// Verify QStash Signature
// ============================================

export async function verifyQStashSignature(
  signature: string,
  body: string
): Promise<boolean> {
  try {
    const isValid = await qstashReceiver.verify({
      signature,
      body,
    });
    return isValid;
  } catch (error) {
    console.error('QStash signature verification failed:', error);
    return false;
  }
}
