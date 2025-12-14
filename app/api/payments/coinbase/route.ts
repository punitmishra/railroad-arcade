import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createCoinbaseCharge } from '@/lib/coinbase';
import { paymentRateLimit } from '@/lib/redis';
import { getPackageById } from '@/lib/stripe';

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

    const totalTokens = pkg.tokens + pkg.bonus;
    const priceInDollars = pkg.price / 100;

    // Create transaction record
    const transaction = await db.transaction.create({
      data: {
        userId: session.user.id,
        type: 'PURCHASE',
        amount: totalTokens,
        price: priceInDollars,
        currency: 'usd',
        provider: 'COINBASE',
        status: 'PENDING',
        metadata: { packageId },
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Create Coinbase charge
    const charge = await createCoinbaseCharge({
      name: pkg.name,
      description: `${totalTokens} tokens for Railroad Arcade`,
      amount: priceInDollars,
      metadata: {
        userId: session.user.id,
        transactionId: transaction.id,
        tokens: totalTokens.toString(),
        packageId,
      },
      redirectUrl: `${baseUrl}/payment/success?transaction_id=${transaction.id}&tokens=${totalTokens}`,
      cancelUrl: `${baseUrl}/payment/cancel?transaction_id=${transaction.id}`,
    });

    // Update transaction with Coinbase charge ID
    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        externalId: charge.id,
        status: 'PROCESSING',
      },
    });

    return NextResponse.json({
      chargeId: charge.id,
      chargeCode: charge.code,
      hostedUrl: charge.hosted_url,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('Coinbase charge creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create crypto payment' },
      { status: 500 }
    );
  }
}
