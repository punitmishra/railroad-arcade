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
