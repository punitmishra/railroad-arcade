import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { verifyPayPalWebhook } from '@/lib/paypal';
import { queue } from '@/lib/queue';
import { userCache } from '@/lib/redis';

// PayPal webhook event types
interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  resource: {
    id: string;
    status: string;
    purchase_units?: Array<{
      custom_id?: string;
      payments?: {
        captures?: Array<{
          id: string;
          status: string;
          amount: {
            currency_code: string;
            value: string;
          };
        }>;
      };
    }>;
  };
  create_time: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();

    // Get PayPal webhook headers
    const paypalHeaders: Record<string, string> = {
      'paypal-auth-algo': headersList.get('paypal-auth-algo') || '',
      'paypal-cert-url': headersList.get('paypal-cert-url') || '',
      'paypal-transmission-id': headersList.get('paypal-transmission-id') || '',
      'paypal-transmission-sig': headersList.get('paypal-transmission-sig') || '',
      'paypal-transmission-time': headersList.get('paypal-transmission-time') || '',
    };

    // Verify webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const isValid = await verifyPayPalWebhook(paypalHeaders, body, webhookId);
    if (!isValid) {
      console.error('PayPal webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event: PayPalWebhookEvent = JSON.parse(body);

    // Handle the event
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED': {
        await handleOrderApproved(event);
        break;
      }

      case 'PAYMENT.CAPTURE.COMPLETED': {
        await handlePaymentCompleted(event);
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED': {
        await handlePaymentDenied(event);
        break;
      }

      case 'PAYMENT.CAPTURE.REFUNDED': {
        await handlePaymentRefunded(event);
        break;
      }

      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleOrderApproved(event: PayPalWebhookEvent) {
  console.log(`PayPal order approved: ${event.resource.id}`);
  // Order approved but not yet captured - waiting for capture
}

async function handlePaymentCompleted(event: PayPalWebhookEvent) {
  const orderId = event.resource.id;
  const purchaseUnit = event.resource.purchase_units?.[0];

  if (!purchaseUnit?.custom_id) {
    console.error('Missing custom_id in PayPal payment');
    return;
  }

  // Parse metadata from custom_id
  let metadata: { userId: string; tokens: string; packageId: string };
  try {
    metadata = JSON.parse(purchaseUnit.custom_id);
  } catch {
    console.error('Invalid custom_id format in PayPal payment');
    return;
  }

  const { userId, tokens } = metadata;
  const tokenAmount = parseInt(tokens, 10);

  // Find transaction by PayPal order ID
  const transaction = await db.transaction.findFirst({
    where: { externalId: orderId },
  });

  if (!transaction) {
    // Try to find by checking metadata
    const txByMeta = await db.transaction.findFirst({
      where: {
        userId,
        provider: 'PAYPAL',
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!txByMeta) {
      console.error('Transaction not found for PayPal order:', orderId);
      return;
    }

    // Update with external ID and complete
    await db.transaction.update({
      where: { id: txByMeta.id },
      data: {
        externalId: orderId,
        status: 'COMPLETED',
      },
    });
  } else {
    // Update existing transaction
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' },
    });
  }

  // Update user's token balance
  await db.user.update({
    where: { id: userId },
    data: {
      tokenBalance: { increment: tokenAmount },
    },
  });

  // Invalidate cache
  await userCache.invalidateBalance(userId);

  // Queue achievement check
  await queue.checkAchievements({ userId });

  console.log(`PayPal payment completed: ${tokenAmount} tokens for user ${userId}`);
}

async function handlePaymentDenied(event: PayPalWebhookEvent) {
  const orderId = event.resource.id;

  // Find and update transaction
  const transaction = await db.transaction.findFirst({
    where: { externalId: orderId },
  });

  if (transaction) {
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' },
    });
  }

  console.log(`PayPal payment denied: ${orderId}`);
}

async function handlePaymentRefunded(event: PayPalWebhookEvent) {
  const orderId = event.resource.id;

  // Find original transaction
  const transaction = await db.transaction.findFirst({
    where: { externalId: orderId },
  });

  if (transaction) {
    // Update transaction status
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'REFUNDED' },
    });

    // Deduct tokens from user balance
    await db.user.update({
      where: { id: transaction.userId },
      data: {
        tokenBalance: { decrement: transaction.amount },
      },
    });

    // Invalidate cache
    await userCache.invalidateBalance(transaction.userId);

    console.log(`PayPal payment refunded: ${transaction.amount} tokens for user ${transaction.userId}`);
  }
}
