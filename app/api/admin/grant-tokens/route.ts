import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin endpoint to grant tokens to all users
// In production, this should be protected by admin authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount = 1000, adminKey } = body;

    // Simple admin key check (in production, use proper auth)
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-testing') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Update all users to have at least the specified amount of tokens
    const result = await db.user.updateMany({
      data: {
        tokenBalance: amount,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        usersUpdated: result.count,
        tokensGranted: amount,
      },
    });
  } catch (error) {
    console.error('Grant tokens error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
