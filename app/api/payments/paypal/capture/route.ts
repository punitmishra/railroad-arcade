import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { capturePayPalOrder } from '@/lib/paypal';
import { userCache } from '@/lib/redis';
import { queue } from '@/lib/queue';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token'); // PayPal order ID

    if (!token) {
      return NextResponse.redirect(
        new URL('/payment/error?reason=missing_token', request.url)
      );
    }

    // Find the transaction
    const transaction = await db.transaction.findFirst({
      where: { externalId: token },
    });

    if (!transaction) {
      return NextResponse.redirect(
        new URL('/payment/error?reason=transaction_not_found', request.url)
      );
    }

    // Capture the payment
    const captureResult = await capturePayPalOrder(token);

    if (captureResult.status !== 'COMPLETED') {
      await db.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });

      return NextResponse.redirect(
        new URL('/payment/error?reason=capture_failed', request.url)
      );
    }

    // Update user's token balance
    await db.user.update({
      where: { id: transaction.userId },
      data: {
        tokenBalance: { increment: transaction.amount },
      },
    });

    // Update transaction status
    await db.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' },
    });

    // Invalidate cache
    await userCache.invalidateBalance(transaction.userId);

    // Queue achievement check
    await queue.checkAchievements({ userId: transaction.userId });

    console.log(
      `PayPal payment completed: ${transaction.amount} tokens for user ${transaction.userId}`
    );

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/payment/success?transaction_id=${transaction.id}&tokens=${transaction.amount}`,
        request.url
      )
    );
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.redirect(
      new URL('/payment/error?reason=server_error', request.url)
    );
  }
}
