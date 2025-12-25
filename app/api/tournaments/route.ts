import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { TournamentStatus, TournamentType, GameMode } from '@prisma/client';

// Valid enum values for validation
const VALID_STATUSES: TournamentStatus[] = ['SCHEDULED', 'REGISTRATION', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const VALID_TYPES: TournamentType[] = ['DAILY', 'WEEKLY', 'SPECIAL', 'CHAMPIONSHIP'];
const VALID_GAME_MODES: GameMode[] = ['FREE_PLAY', 'SPEED_RUN', 'DELIVERY_MISSION', 'SURVIVAL', 'TIME_ATTACK'];

// ============================================
// GET /api/tournaments - List tournaments
// ============================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 100);

    // Validate status enum if provided
    let status: TournamentStatus | null = null;
    if (statusParam && statusParam !== 'all') {
      if (!VALID_STATUSES.includes(statusParam as TournamentStatus)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      status = statusParam as TournamentStatus;
    }

    // Build where clause
    const where: { status?: TournamentStatus | { in: TournamentStatus[] } } = {};
    if (status) {
      where.status = status;
    } else if (statusParam !== 'all') {
      // By default, show active, registration, and scheduled tournaments
      where.status = { in: ['ACTIVE', 'REGISTRATION', 'SCHEDULED'] };
    }

    const tournaments = await db.tournament.findMany({
      where,
      orderBy: { startTime: 'asc' },
      take: limit,
      include: {
        _count: { select: { entries: true } },
      },
    });

    // Check if user is registered for each tournament
    const tournamentData = await Promise.all(
      tournaments.map(async (t) => {
        let isRegistered = false;
        let userEntry = null;

        if (session?.user?.id) {
          const entry = await db.tournamentEntry.findUnique({
            where: {
              tournamentId_userId: {
                tournamentId: t.id,
                userId: session.user.id,
              },
            },
          });
          isRegistered = !!entry;
          userEntry = entry;
        }

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          type: t.type,
          status: t.status,
          gameMode: t.gameMode,
          registrationStart: t.registrationStart,
          registrationEnd: t.registrationEnd,
          startTime: t.startTime,
          endTime: t.endTime,
          maxParticipants: t.maxParticipants,
          entryFee: t.entryFee,
          minLevel: t.minLevel,
          attemptsPerPlayer: t.attemptsPerPlayer,
          prizePool: t.prizePool,
          prizes: t.prizes,
          participantCount: t._count.entries,
          isRegistered,
          userEntry,
        };
      })
    );

    return NextResponse.json({
      success: true,
      tournaments: tournamentData,
    });
  } catch (error) {
    console.error('Failed to fetch tournaments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/tournaments - Create tournament (admin only)
// ============================================

interface ValidationError {
  field: string;
  message: string;
}

function validateTournamentInput(body: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required string fields
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (body.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be 100 characters or less' });
  }

  // Type validation
  if (!body.type || !VALID_TYPES.includes(body.type as TournamentType)) {
    errors.push({ field: 'type', message: `Type must be one of: ${VALID_TYPES.join(', ')}` });
  }

  // Game mode validation
  if (!body.gameMode || !VALID_GAME_MODES.includes(body.gameMode as GameMode)) {
    errors.push({ field: 'gameMode', message: `Game mode must be one of: ${VALID_GAME_MODES.join(', ')}` });
  }

  // Date validations
  const now = new Date();
  let registrationStart: Date | null = null;
  let registrationEnd: Date | null = null;
  let startTime: Date | null = null;
  let endTime: Date | null = null;

  if (!body.registrationStart) {
    errors.push({ field: 'registrationStart', message: 'Registration start date is required' });
  } else {
    registrationStart = new Date(body.registrationStart as string);
    if (isNaN(registrationStart.getTime())) {
      errors.push({ field: 'registrationStart', message: 'Invalid registration start date' });
    }
  }

  if (!body.registrationEnd) {
    errors.push({ field: 'registrationEnd', message: 'Registration end date is required' });
  } else {
    registrationEnd = new Date(body.registrationEnd as string);
    if (isNaN(registrationEnd.getTime())) {
      errors.push({ field: 'registrationEnd', message: 'Invalid registration end date' });
    }
  }

  if (!body.startTime) {
    errors.push({ field: 'startTime', message: 'Start time is required' });
  } else {
    startTime = new Date(body.startTime as string);
    if (isNaN(startTime.getTime())) {
      errors.push({ field: 'startTime', message: 'Invalid start time' });
    }
  }

  if (!body.endTime) {
    errors.push({ field: 'endTime', message: 'End time is required' });
  } else {
    endTime = new Date(body.endTime as string);
    if (isNaN(endTime.getTime())) {
      errors.push({ field: 'endTime', message: 'Invalid end time' });
    }
  }

  // Date order validation
  if (registrationStart && registrationEnd && registrationStart >= registrationEnd) {
    errors.push({ field: 'registrationEnd', message: 'Registration end must be after registration start' });
  }
  if (registrationEnd && startTime && registrationEnd > startTime) {
    errors.push({ field: 'startTime', message: 'Start time must be at or after registration end' });
  }
  if (startTime && endTime && startTime >= endTime) {
    errors.push({ field: 'endTime', message: 'End time must be after start time' });
  }

  // Numeric validations
  if (body.maxParticipants !== undefined) {
    const max = Number(body.maxParticipants);
    if (isNaN(max) || max < 1 || max > 10000) {
      errors.push({ field: 'maxParticipants', message: 'Max participants must be between 1 and 10000' });
    }
  }

  if (body.entryFee !== undefined) {
    const fee = Number(body.entryFee);
    if (isNaN(fee) || fee < 0) {
      errors.push({ field: 'entryFee', message: 'Entry fee must be 0 or positive' });
    }
  }

  if (body.minLevel !== undefined) {
    const level = Number(body.minLevel);
    if (isNaN(level) || level < 1 || level > 5) {
      errors.push({ field: 'minLevel', message: 'Min level must be between 1 and 5' });
    }
  }

  if (body.attemptsPerPlayer !== undefined) {
    const attempts = Number(body.attemptsPerPlayer);
    if (isNaN(attempts) || attempts < 1 || attempts > 100) {
      errors.push({ field: 'attemptsPerPlayer', message: 'Attempts per player must be between 1 and 100' });
    }
  }

  if (body.prizePool !== undefined) {
    const pool = Number(body.prizePool);
    if (isNaN(pool) || pool < 0) {
      errors.push({ field: 'prizePool', message: 'Prize pool must be 0 or positive' });
    }
  }

  return errors;
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access first (before parsing body)
    const adminKey = request.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_KEY) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // Could add additional admin user check here
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationErrors = validateTournamentInput(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      type,
      gameMode,
      registrationStart,
      registrationEnd,
      startTime,
      endTime,
      maxParticipants,
      entryFee,
      minLevel,
      attemptsPerPlayer,
      prizePool,
      prizes,
    } = body;

    const tournament = await db.tournament.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: type as TournamentType,
        gameMode: gameMode as GameMode,
        registrationStart: new Date(registrationStart),
        registrationEnd: new Date(registrationEnd),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        maxParticipants: maxParticipants || 100,
        entryFee: entryFee || 0,
        minLevel: minLevel || 1,
        attemptsPerPlayer: attemptsPerPlayer || 3,
        prizePool: prizePool || 0,
        prizes: prizes || [],
      },
    });

    return NextResponse.json({
      success: true,
      tournament,
    });
  } catch (error) {
    console.error('Failed to create tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
