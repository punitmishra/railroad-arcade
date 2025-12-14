import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { DEFAULT_COIN_CONFIG } from '@/lib/kiosk-config';

// ============================================
// Coin Acceptor API Endpoint
// ============================================
// Receives signals from physical coin acceptor
// hardware and credits tokens to the user/cabinet.

// ============================================
// POST - Credit tokens from coin insert
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coinType, cabinetId, pulseCount, signature } = body;

    // Validate required fields
    if (!coinType && !pulseCount) {
      return NextResponse.json(
        { error: 'Missing coinType or pulseCount' },
        { status: 400 }
      );
    }

    // Validate signature if provided (for security)
    // In production, this would verify a signed message from the coin acceptor
    // to prevent spoofed coin credits
    if (process.env.COIN_ACCEPTOR_SECRET && signature) {
      const expectedSignature = await generateSignature(cabinetId, pulseCount);
      if (signature !== expectedSignature) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 403 }
        );
      }
    }

    // Calculate tokens based on coin type or pulse count
    let tokensToCredit = 0;

    if (coinType && DEFAULT_COIN_CONFIG.tokensPer[coinType]) {
      tokensToCredit = DEFAULT_COIN_CONFIG.tokensPer[coinType];
    } else if (pulseCount) {
      // Assume 1 pulse = 1 quarter = 1 token by default
      tokensToCredit = Math.floor(pulseCount);
    }

    if (tokensToCredit <= 0) {
      return NextResponse.json(
        { error: 'Invalid coin type or pulse count' },
        { status: 400 }
      );
    }

    // Try to get authenticated user session
    const session = await getServerSession(authOptions);

    if (session?.user?.id) {
      // Credit to authenticated user
      const user = await db.user.update({
        where: { id: session.user.id },
        data: {
          tokenBalance: { increment: tokensToCredit },
        },
        select: {
          id: true,
          tokenBalance: true,
        },
      });

      // Log the coin insert
      await logCoinInsert({
        userId: session.user.id,
        cabinetId,
        coinType,
        pulseCount,
        tokensCreated: tokensToCredit,
      });

      return NextResponse.json({
        success: true,
        tokensCreated: tokensToCredit,
        newBalance: user.tokenBalance,
        userId: user.id,
      });
    }

    // For anonymous kiosk sessions, return tokens without user association
    // The kiosk client will track tokens locally
    return NextResponse.json({
      success: true,
      tokensCreated: tokensToCredit,
      anonymous: true,
    });
  } catch (error) {
    console.error('Coin acceptor error:', error);
    return NextResponse.json(
      { error: 'Failed to process coin' },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Check coin acceptor status
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cabinetId = searchParams.get('cabinetId');

  try {
    // Return coin acceptor configuration and status
    return NextResponse.json({
      enabled: DEFAULT_COIN_CONFIG.enabled,
      coinTypes: Object.keys(DEFAULT_COIN_CONFIG.tokensPer),
      tokensPerCoin: DEFAULT_COIN_CONFIG.tokensPer,
      cabinetId: cabinetId ?? 'unknown',
      status: 'ready',
    });
  } catch (error) {
    console.error('Coin status error:', error);
    return NextResponse.json(
      { error: 'Failed to get coin acceptor status' },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Functions
// ============================================

async function generateSignature(cabinetId: string, pulseCount: number): Promise<string> {
  const secret = process.env.COIN_ACCEPTOR_SECRET || '';
  const data = `${cabinetId}:${pulseCount}:${secret}`;

  // Use Web Crypto API for hashing
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function logCoinInsert(data: {
  userId: string;
  cabinetId?: string;
  coinType?: string;
  pulseCount?: number;
  tokensCreated: number;
}): Promise<void> {
  // In production, this would log to a dedicated coin transaction table
  // For now, we'll just log to console
  console.log('Coin insert:', {
    timestamp: new Date().toISOString(),
    ...data,
  });
}
