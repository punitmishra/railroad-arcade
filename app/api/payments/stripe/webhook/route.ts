import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/stripe';
import { queue } from '@/lib/queue';
import { userCache } from '@/lib/redis';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, tokens } = session.metadata || {};

  if (!userId || !tokens) {
    console.error('Missing metadata in checkout session');
    return;
  }

  const tokenAmount = parseInt(tokens, 10);

  // Find transaction by Stripe session ID
  const transaction = await db.transaction.findFirst({
    where: { externalId: session.id },
  });

  if (!transaction) {
    console.error('Transaction not found for session:', session.id);
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
    where: { id: transaction.id },
    data: { status: 'COMPLETED' },
  });

  // Invalidate cache
  await userCache.invalidateBalance(userId);

  // Queue achievement check
  await queue.checkAchievements({ userId });

  console.log(`Payment completed: ${tokenAmount} tokens for user ${userId}`);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Find and update transaction
  const transaction = await db.transaction.findFirst({
    where: { externalId: session.id },
  });

  if (transaction) {
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' },
    });
  }

  console.log(`Checkout expired: ${session.id}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Payment failed: ${paymentIntent.id}`);
  // Additional failure handling can be added here
}
