// ============================================
// Achievements API
// ============================================
// GET: Fetch user achievements

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserAchievements, ACHIEVEMENTS, AchievementType } from '@/lib/achievements';

// ============================================
// GET - Fetch User Achievements
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { earned, unearned, totalPoints } = await getUserAchievements(
      session.user.id
    );

    // Get full details for earned achievements
    const earnedDetails = earned.map((type) => ({
      ...ACHIEVEMENTS[type],
      earned: true,
    }));

    // Get details for unearned (hide secret ones that aren't earned)
    const unearnedDetails = unearned
      .filter((type) => !ACHIEVEMENTS[type].secret)
      .map((type) => ({
        ...ACHIEVEMENTS[type],
        earned: false,
      }));

    // Calculate progress
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;
    const maxPoints = Object.values(ACHIEVEMENTS).reduce(
      (sum, a) => sum + a.points,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        earned: earnedDetails,
        available: unearnedDetails,
        stats: {
          earned: earned.length,
          total: totalAchievements,
          points: totalPoints,
          maxPoints,
          progress: Math.round((earned.length / totalAchievements) * 100),
        },
      },
    });
  } catch (error) {
    console.error('Achievements fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
