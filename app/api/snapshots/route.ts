import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/snapshots - Fetch user's snapshots
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build where clause based on filter
    const whereClause: {
      userId: string;
      liked?: boolean;
      level?: number;
    } = {
      userId: session.user.id,
    };

    if (filter === 'liked') {
      whereClause.liked = true;
    } else if (filter === 'level1') {
      whereClause.level = 1;
    } else if (filter === 'level2') {
      whereClause.level = 2;
    }

    const [snapshots, total] = await Promise.all([
      db.snapshot.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.snapshot.count({ where: whereClause }),
    ]);

    // Get stats
    const stats = await db.snapshot.groupBy({
      by: ['liked', 'level'],
      where: { userId: session.user.id },
      _count: true,
    });

    const likedCount = stats
      .filter(s => s.liked)
      .reduce((acc, s) => acc + s._count, 0);
    const level1Count = stats
      .filter(s => s.level === 1)
      .reduce((acc, s) => acc + s._count, 0);
    const level2Count = stats
      .filter(s => s.level === 2)
      .reduce((acc, s) => acc + s._count, 0);
    const totalCount = await db.snapshot.count({
      where: { userId: session.user.id }
    });

    return NextResponse.json({
      success: true,
      data: {
        snapshots: snapshots.map(s => ({
          id: s.id,
          timestamp: s.createdAt,
          thumbnail: s.thumbnail || s.url,
          fullUrl: s.url,
          camera: s.camera,
          trainId: s.trainId,
          trainName: s.trainName,
          level: s.level,
          liked: s.liked,
          tags: s.tags,
          description: s.description,
        })),
        total,
        stats: {
          total: totalCount,
          liked: likedCount,
          level1: level1Count,
          level2: level2Count,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch snapshots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}

// POST /api/snapshots - Create a new snapshot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, thumbnail, camera, trainId, trainName, level, sessionId, description, tags } = body;

    if (!url || !camera || level === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: url, camera, level' },
        { status: 400 }
      );
    }

    const snapshot = await db.snapshot.create({
      data: {
        userId: session.user.id,
        url,
        thumbnail: thumbnail || url,
        camera,
        trainId: trainId || null,
        trainName: trainName || null,
        level: parseInt(level, 10),
        sessionId: sessionId || null,
        description: description || null,
        tags: tags || [],
        liked: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: snapshot.id,
        timestamp: snapshot.createdAt,
        thumbnail: snapshot.thumbnail || snapshot.url,
        fullUrl: snapshot.url,
        camera: snapshot.camera,
        trainId: snapshot.trainId,
        trainName: snapshot.trainName,
        level: snapshot.level,
        liked: snapshot.liked,
        tags: snapshot.tags,
        description: snapshot.description,
      },
    });
  } catch (error) {
    console.error('Failed to create snapshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}

// PATCH /api/snapshots - Update a snapshot (like/unlike, update description)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, liked, description, tags } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing snapshot ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.snapshot.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Snapshot not found' },
        { status: 404 }
      );
    }

    const updateData: {
      liked?: boolean;
      description?: string;
      tags?: string[];
    } = {};

    if (liked !== undefined) updateData.liked = liked;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;

    const snapshot = await db.snapshot.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: snapshot.id,
        liked: snapshot.liked,
        description: snapshot.description,
        tags: snapshot.tags,
      },
    });
  } catch (error) {
    console.error('Failed to update snapshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update snapshot' },
      { status: 500 }
    );
  }
}

// DELETE /api/snapshots - Delete a snapshot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing snapshot ID' },
        { status: 400 }
      );
    }

    // Verify ownership
    const existing = await db.snapshot.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Snapshot not found' },
        { status: 404 }
      );
    }

    await db.snapshot.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete snapshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete snapshot' },
      { status: 500 }
    );
  }
}
