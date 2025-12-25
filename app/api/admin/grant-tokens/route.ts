import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Admin endpoint to grant tokens to all users
// Protected by ADMIN_KEY environment variable
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount = 1000, adminKey } = body;

    // Require ADMIN_KEY to be set in environment
    if (!process.env.ADMIN_KEY) {
      console.error('ADMIN_KEY environment variable not configured');
      return NextResponse.json({ success: false, error: 'Admin endpoint not configured' }, { status: 503 });
    }

    // Validate admin key
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
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
