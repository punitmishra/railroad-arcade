import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection by counting users
    const userCount = await db.user.count();

    // Get database info
    const result = await db.$queryRaw`SELECT version()` as { version: string }[];

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        userCount,
        dbVersion: result[0]?.version || 'Unknown',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Database test error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Database connection failed',
        details: errorMessage,
        hint: 'Make sure DATABASE_URL is set correctly in .env',
      },
      { status: 500 }
    );
  }
}
