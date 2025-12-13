import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { verifyCoinbaseWebhook, CoinbaseWebhookEvent } from '@/lib/coinbase';
import { userCache } from '@/lib/redis';
import { queue } from '@/lib/queue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-cc-webhook-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValid = verifyCoinbaseWebhook(body, signature);
    if (!isValid) {
      console.error('Coinbase webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event: CoinbaseWebhookEvent = JSON.parse(body);

    // Handle the event
    switch (event.type) {
      case 'charge:confirmed':
        await handleChargeConfirmed(event);
        break;

      case 'charge:failed':
        await handleChargeFailed(event);
        break;

      case 'charge:delayed':
        // Payment received but not enough confirmations yet
        console.log(`Charge delayed: ${event.data.id}`);
        break;

      case 'charge:pending':
        // Payment detected, waiting for confirmation
        console.log(`Charge pending: ${event.data.id}`);
        break;

      default:
        console.log(`Unhandled Coinbase event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Coinbase webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleChargeConfirmed(event: CoinbaseWebhookEvent) {
  const charge = event.data;
  const { userId, tokens, transactionId } = charge.metadata;

  if (!userId || !tokens || !transactionId) {
    console.error('Missing metadata in Coinbase charge');
    return;
  }

  const tokenAmount = parseInt(tokens, 10);

  // Find transaction
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    console.error('Transaction not found:', transactionId);
    return;
  }

  if (transaction.status === 'COMPLETED') {
    console.log('Transaction already completed:', transactionId);
    return;
  }

  // Update user's token balance
  await db.user.update({
    where: { id: userId },
    data: {
      tokenBalance: { increment: tokenAmount },
    },
  });

  // Update transaction status
  await db.transaction.update({
    where: { id: transactionId },
    data: { status: 'COMPLETED' },
  });

  // Invalidate cache
  await userCache.invalidateBalance(userId);

  // Queue achievement check
  await queue.checkAchievements({ userId });

  console.log(`Crypto payment confirmed: ${tokenAmount} tokens for user ${userId}`);
}

async function handleChargeFailed(event: CoinbaseWebhookEvent) {
  const charge = event.data;
  const { transactionId } = charge.metadata;

  if (transactionId) {
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: 'FAILED' },
    });
  }

  console.log(`Crypto payment failed: ${charge.id}`);
}
