import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPayPalOrder } from '@/lib/paypal';
import { paymentRateLimit } from '@/lib/redis';
import { TOKEN_PACKAGES, getPackageById } from '@/lib/stripe';

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
        provider: 'PAYPAL',
        status: 'PENDING',
        metadata: { packageId },
      },
    });

    // Create PayPal order
    const order = await createPayPalOrder({
      amount: priceInDollars,
      description: `${pkg.name} - ${totalTokens} tokens`,
      metadata: {
        userId: session.user.id,
        transactionId: transaction.id,
        tokens: totalTokens.toString(),
        packageId,
      },
    });

    // Update transaction with PayPal order ID
    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        externalId: order.id,
        status: 'PROCESSING',
      },
    });

    // Find the approval URL
    const approvalUrl = order.links?.find(
      (link: { rel: string }) => link.rel === 'approve'
    )?.href;

    return NextResponse.json({
      orderId: order.id,
      approvalUrl,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create PayPal order' },
      { status: 500 }
    );
  }
}

// Get available packages
export async function GET() {
  return NextResponse.json({
    packages: TOKEN_PACKAGES.map((pkg) => ({
      ...pkg,
      priceFormatted: `$${(pkg.price / 100).toFixed(2)}`,
      totalTokens: pkg.tokens + pkg.bonus,
    })),
  });
}
