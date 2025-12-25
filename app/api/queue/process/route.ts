import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyQStashSignature, QueueJob } from '@/lib/queue';
import { userCache } from '@/lib/redis';

// ============================================
// QStash Webhook Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    // Get the signature from headers
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();

    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && signature) {
      const isValid = await verifyQStashSignature(signature, body);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the job
    const job: QueueJob = JSON.parse(body);

    // Process based on job type
    switch (job.type) {
      case 'PROCESS_PAYMENT':
        await handleProcessPayment(job.payload as ProcessPaymentPayload);
        break;

      case 'FULFILL_TOKENS':
        await handleFulfillTokens(job.payload as FulfillTokensPayload);
        break;

      case 'ARCHIVE_SESSION':
        await handleArchiveSession(job.payload as ArchiveSessionPayload);
        break;

      case 'CHECK_ACHIEVEMENTS':
        await handleCheckAchievements(job.payload as CheckAchievementsPayload);
        break;

      case 'SEND_EMAIL':
        await handleSendEmail(job.payload as SendEmailPayload);
        break;

      case 'GENERATE_THUMBNAIL':
        await handleGenerateThumbnail(job.payload as GenerateThumbnailPayload);
        break;

      case 'AGGREGATE_STATS':
        await handleAggregateStats(job.payload as AggregateStatsPayload);
        break;

      case 'TOURNAMENT_STATUS_CHECK':
        await handleTournamentStatusCheck(job.payload as TournamentStatusCheckPayload);
        break;

      case 'TOURNAMENT_FINALIZE':
        await handleTournamentFinalize(job.payload as TournamentFinalizePayload);
        break;

      case 'TOURNAMENT_DISTRIBUTE_PRIZES':
        await handleTournamentDistributePrizes(job.payload as TournamentDistributePrizesPayload);
        break;

      default:
        console.warn(`Unknown job type: ${job.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Queue processing error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

// ============================================
// Job Handlers
// ============================================

interface ProcessPaymentPayload {
  transactionId: string;
  provider: string;
  externalId: string;
}

async function handleProcessPayment(payload: ProcessPaymentPayload) {
  const { transactionId } = payload;

  // Update transaction status
  await db.transaction.update({
    where: { id: transactionId },
    data: { status: 'COMPLETED' },
  });

  console.log(`Payment processed: ${transactionId}`);
}

interface FulfillTokensPayload {
  transactionId: string;
  userId: string;
  amount: number;
}

async function handleFulfillTokens(payload: FulfillTokensPayload) {
  const { userId, amount, transactionId } = payload;

  // Update user's token balance
  await db.user.update({
    where: { id: userId },
    data: {
      tokenBalance: { increment: amount },
    },
  });

  // Update transaction status
  await db.transaction.update({
    where: { id: transactionId },
    data: { status: 'COMPLETED' },
  });

  // Invalidate cache
  await userCache.invalidateBalance(userId);

  console.log(`Tokens fulfilled: ${amount} for user ${userId}`);
}

interface ArchiveSessionPayload {
  sessionId: string;
  userId: string;
}

async function handleArchiveSession(payload: ArchiveSessionPayload) {
  const { sessionId, userId } = payload;

  // Get session with events
  const session = await db.playSession.findUnique({
    where: { id: sessionId },
    include: { events: true },
  });

  if (!session) {
    console.warn(`Session not found: ${sessionId}`);
    return;
  }

  // Update user stats
  await db.user.update({
    where: { id: userId },
    data: {
      totalSessions: { increment: 1 },
      totalTokensUsed: { increment: session.tokensSpent },
    },
  });

  console.log(`Session archived: ${sessionId}`);
}

interface CheckAchievementsPayload {
  userId: string;
  sessionId?: string;
  triggerEvent?: string;
}

async function handleCheckAchievements(payload: CheckAchievementsPayload) {
  const { userId } = payload;

  // Get user stats
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      achievements: true,
      playSessions: {
        where: { status: 'COMPLETED' },
      },
    },
  });

  if (!user) return;

  const earnedTypes = user.achievements.map((a: { type: string }) => a.type);
  const newAchievements: string[] = [];

  // Check FIRST_RUN
  if (!earnedTypes.includes('FIRST_RUN') && user.playSessions.length >= 1) {
    newAchievements.push('FIRST_RUN');
  }

  // Check MARATHON (10 sessions)
  if (!earnedTypes.includes('MARATHON') && user.playSessions.length >= 10) {
    newAchievements.push('MARATHON');
  }

  // Check VETERAN (50 sessions)
  if (!earnedTypes.includes('VETERAN') && user.playSessions.length >= 50) {
    newAchievements.push('VETERAN');
  }

  // Award new achievements
  for (const type of newAchievements) {
    await db.achievement.create({
      data: {
        userId,
        type: type as 'FIRST_RUN' | 'MARATHON' | 'VETERAN',
      },
    });
  }

  if (newAchievements.length > 0) {
    console.log(`Achievements awarded to ${userId}:`, newAchievements);
  }
}

interface SendEmailPayload {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

async function handleSendEmail(payload: SendEmailPayload) {
  // TODO: Integrate with email provider (Resend, SendGrid, etc.)
  console.log(`Email queued: ${payload.template} to ${payload.to}`);
}

interface GenerateThumbnailPayload {
  snapshotId: string;
  imageUrl: string;
}

async function handleGenerateThumbnail(payload: GenerateThumbnailPayload) {
  // TODO: Generate thumbnail using image processing service
  console.log(`Thumbnail generation queued for: ${payload.snapshotId}`);
}

interface AggregateStatsPayload {
  date: string;
  type: string;
}

async function handleAggregateStats(payload: AggregateStatsPayload) {
  const { date, type } = payload;

  if (type === 'daily') {
    // Aggregate daily stats
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await db.playSession.aggregate({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      _count: true,
      _sum: {
        tokensSpent: true,
        duration: true,
        totalDistance: true,
      },
    });

    console.log(`Daily stats aggregated for ${date}:`, sessions);
  }
}

// ============================================
// Tournament Handlers
// ============================================

interface TournamentStatusCheckPayload {
  tournamentId?: string;
}

async function handleTournamentStatusCheck(payload: TournamentStatusCheckPayload) {
  const now = new Date();
  const { tournamentId } = payload;

  // Build query - either specific tournament or all active ones
  const tournaments = await db.tournament.findMany({
    where: tournamentId
      ? { id: tournamentId }
      : { status: { in: ['SCHEDULED', 'REGISTRATION', 'ACTIVE'] } },
  });

  for (const tournament of tournaments) {
    // Use interactive transaction with atomic status check to prevent race conditions
    await db.$transaction(async (tx) => {
      // Re-fetch tournament inside transaction for atomic check
      const currentTournament = await tx.tournament.findUnique({
        where: { id: tournament.id },
      });

      if (!currentTournament) return;

      let newStatus: 'REGISTRATION' | 'ACTIVE' | 'FINALIZING' | null = null;

      // SCHEDULED -> REGISTRATION (when registrationStart passed)
      if (currentTournament.status === 'SCHEDULED' && now >= currentTournament.registrationStart) {
        newStatus = 'REGISTRATION';
      }

      // REGISTRATION -> ACTIVE (when startTime passed)
      if (currentTournament.status === 'REGISTRATION' && now >= currentTournament.startTime) {
        newStatus = 'ACTIVE';
      }

      // ACTIVE -> FINALIZING (when endTime passed) - prevents duplicate finalization
      if (currentTournament.status === 'ACTIVE' && now >= currentTournament.endTime) {
        // Mark as FINALIZING to prevent race condition
        await tx.tournament.update({
          where: { id: currentTournament.id },
          data: { status: 'FINALIZING' as 'ACTIVE' }, // Cast needed - we handle this state internally
        });

        // Queue finalization job outside transaction
        const { queue } = await import('@/lib/queue');
        await queue.finalizeTournament({ tournamentId: currentTournament.id });
        console.log(`Tournament ${currentTournament.id} queued for finalization`);
        return;
      }

      // Update status if changed
      if (newStatus) {
        await tx.tournament.update({
          where: { id: currentTournament.id },
          data: { status: newStatus },
        });
        console.log(`Tournament ${currentTournament.id} status changed to ${newStatus}`);
      }
    });
  }
}

interface TournamentFinalizePayload {
  tournamentId: string;
}

async function handleTournamentFinalize(payload: TournamentFinalizePayload) {
  const { tournamentId } = payload;

  // Use interactive transaction to prevent race conditions
  const result = await db.$transaction(async (tx) => {
    // Get tournament with entries inside transaction
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        entries: {
          orderBy: [
            { score: 'desc' },
            { bestTime: 'asc' },
            { registeredAt: 'asc' },
          ],
        },
      },
    });

    if (!tournament) {
      console.error(`Tournament not found: ${tournamentId}`);
      return { success: false, reason: 'not_found' };
    }

    // Check status - only finalize ACTIVE or FINALIZING tournaments
    if (tournament.status === 'COMPLETED' || tournament.status === 'CANCELLED') {
      console.log(`Tournament ${tournamentId} already ${tournament.status}`);
      return { success: false, reason: 'already_done' };
    }

    // Calculate ranks with proper tie handling
    let currentRank = 0;
    let lastScore: number | null = null;
    let lastTime: number | null = null;

    for (let i = 0; i < tournament.entries.length; i++) {
      const entry = tournament.entries[i];

      // Check if this is a tie with previous entry
      const isTie = lastScore === entry.score && lastTime === entry.bestTime;

      if (!isTie) {
        currentRank = i + 1; // Dense ranking - tied entries share same rank
      }

      await tx.tournamentEntry.update({
        where: { id: entry.id },
        data: { rank: currentRank },
      });

      lastScore = entry.score;
      lastTime = entry.bestTime;
    }

    // Mark tournament as completed
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: 'COMPLETED' },
    });

    return { success: true, entryCount: tournament.entries.length };
  });

  if (!result.success) {
    return;
  }

  console.log(`Tournament ${tournamentId} finalized with ${result.entryCount} entries`);

  // Queue prize distribution
  const { queue } = await import('@/lib/queue');
  await queue.distributePrizes({ tournamentId });
}

interface TournamentDistributePrizesPayload {
  tournamentId: string;
}

interface TournamentPrize {
  rank: number;
  tokens: number;
  badge?: string;
  title?: string;
}

async function handleTournamentDistributePrizes(payload: TournamentDistributePrizesPayload) {
  const { tournamentId } = payload;

  // Use interactive transaction for idempotency
  const result = await db.$transaction(async (tx) => {
    // Get tournament with top entries
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        entries: {
          where: { rank: { lte: 10 } }, // Top 10 for prizes
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!tournament) {
      console.error(`Tournament not found for prize distribution: ${tournamentId}`);
      return { success: false, reason: 'not_found' };
    }

    // Verify tournament is completed
    if (tournament.status !== 'COMPLETED') {
      console.error(`Tournament ${tournamentId} not in COMPLETED status: ${tournament.status}`);
      return { success: false, reason: 'not_completed' };
    }

    // Idempotency check: Look for existing prize transactions for this tournament
    const existingPrizeTransactions = await tx.transaction.findFirst({
      where: {
        type: 'BONUS',
        metadata: {
          path: ['type'],
          equals: 'tournament_prize',
        },
        AND: {
          metadata: {
            path: ['tournamentId'],
            equals: tournamentId,
          },
        },
      },
    });

    if (existingPrizeTransactions) {
      console.log(`Prizes already distributed for tournament ${tournamentId}, skipping`);
      return { success: false, reason: 'already_distributed' };
    }

    const prizes = (tournament.prizes as unknown as TournamentPrize[]) || [];
    let prizesAwarded = 0;

    for (const entry of tournament.entries) {
      const prize = prizes.find((p) => p.rank === entry.rank);
      if (!prize) continue;

      // Award tokens
      if (prize.tokens > 0) {
        await tx.user.update({
          where: { id: entry.userId },
          data: { tokenBalance: { increment: prize.tokens } },
        });

        await tx.transaction.create({
          data: {
            userId: entry.userId,
            type: 'BONUS',
            amount: prize.tokens,
            status: 'COMPLETED',
            metadata: {
              type: 'tournament_prize',
              tournamentId,
              tournamentName: tournament.name,
              rank: entry.rank,
              badge: prize.badge,
              title: prize.title,
            },
          },
        });

        prizesAwarded++;
      }

      // Award badge achievement if applicable
      if (prize.badge) {
        const achievementType = `TOURNAMENT_${prize.badge.toUpperCase()}`;

        // Check if achievement type exists and create if not already earned
        try {
          await tx.achievement.upsert({
            where: {
              userId_type: {
                userId: entry.userId,
                type: achievementType as 'TOURNAMENT_CHAMPION' | 'TOURNAMENT_SILVER' | 'TOURNAMENT_BRONZE',
              },
            },
            create: {
              userId: entry.userId,
              type: achievementType as 'TOURNAMENT_CHAMPION' | 'TOURNAMENT_SILVER' | 'TOURNAMENT_BRONZE',
            },
            update: {}, // Already has achievement
          });
        } catch (error) {
          // Achievement type may not exist yet in schema
          console.warn(`Could not award achievement ${achievementType}:`, error);
        }
      }

      console.log(
        `Prize awarded: ${prize.tokens} tokens to user ${entry.userId} (rank ${entry.rank})`
      );
    }

    return { success: true, prizesAwarded, userIds: tournament.entries.map(e => e.userId) };
  });

  if (!result.success) {
    return;
  }

  // Invalidate user caches outside transaction
  for (const userId of result.userIds || []) {
    await userCache.invalidateBalance(userId);
  }

  console.log(`Prizes distributed for tournament ${tournamentId}: ${result.prizesAwarded} awards`);
}
