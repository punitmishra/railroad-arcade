// ============================================
// Session Validation API
// ============================================
// Validates if the current user has an active
// queue session and can control the hardware.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasActiveControl, getRemainingControlTime } from '@/lib/queue-manager';

export interface SessionValidation {
  valid: boolean;
  hasControl: boolean;
  remainingSeconds: number;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        valid: false,
        hasControl: false,
        remainingSeconds: 0,
        error: 'Not authenticated',
      });
    }

    // Check if user has active control
    const [hasControl, remainingTime] = await Promise.all([
      hasActiveControl(session.user.id),
      getRemainingControlTime(session.user.id),
    ]);

    return NextResponse.json({
      valid: hasControl,
      hasControl,
      remainingSeconds: remainingTime,
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        hasControl: false,
        remainingSeconds: 0,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
