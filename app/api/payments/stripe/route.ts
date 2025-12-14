import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createCheckoutSession, getPackageById } from '@/lib/stripe';
import { paymentRateLimit } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? 'anonymous';
    const { success } = await paymentRateLimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { packageId } = body;

    // Validate package
    const pkg = getPackageById(packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Get user email
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    if (!user?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Calculate total tokens
    const totalTokens = pkg.tokens + pkg.bonus;

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        userId: session.user.id,
        type: 'PURCHASE',
        amount: totalTokens,
        price: pkg.price / 100, // Convert cents to dollars
        currency: 'usd',
        provider: 'STRIPE',
        status: 'PENDING',
        metadata: { packageId },
      },
    });

    // Create Stripe checkout session
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      userEmail: user.email,
      packageId,
      successUrl: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&transaction_id=${transaction.id}&tokens=${totalTokens}`,
      cancelUrl: `${baseUrl}/payment/cancel?transaction_id=${transaction.id}`,
    });

    // Update transaction with Stripe session ID
    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        externalId: checkoutSession.id,
        status: 'PROCESSING',
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
