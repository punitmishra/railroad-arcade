// ============================================
// Recordings API
// ============================================
// GET: Fetch user recordings
// POST: Start a new recording
// PATCH: Update recording (stop, add metadata)
// DELETE: Delete a recording

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

// ============================================
// GET - Fetch Recordings
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

    const { searchParams } = request.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status');

    const whereClause: any = { userId: session.user.id };
    if (status) {
      whereClause.status = status;
    }

    const recordings = await db.recording.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: { recordings },
    });
  } catch (error) {
    console.error('Recordings fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recordings' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Start Recording
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { camera, sessionId } = body;

    if (!camera) {
      return NextResponse.json(
        { success: false, error: 'Camera ID required' },
        { status: 400 }
      );
    }

    // Check for existing active recording
    const existingRecording = await db.recording.findFirst({
      where: {
        userId: session.user.id,
        status: 'RECORDING',
      },
    });

    if (existingRecording) {
      return NextResponse.json(
        { success: false, error: 'Already have an active recording' },
        { status: 400 }
      );
    }

    // Create new recording
    const recording = await db.recording.create({
      data: {
        userId: session.user.id,
        camera,
        sessionId,
        startTime: new Date(),
        status: 'RECORDING',
      },
    });

    return NextResponse.json({
      success: true,
      data: { recording },
    });
  } catch (error) {
    console.error('Recording start error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start recording' },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Update Recording (Stop, etc.)
// ============================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recordingId, action, url, thumbnail } = body;

    if (!recordingId) {
      return NextResponse.json(
        { success: false, error: 'Recording ID required' },
        { status: 400 }
      );
    }

    // Find recording
    const recording = await db.recording.findFirst({
      where: {
        id: recordingId,
        userId: session.user.id,
      },
    });

    if (!recording) {
      return NextResponse.json(
        { success: false, error: 'Recording not found' },
        { status: 404 }
      );
    }

    let updatedRecording;

    switch (action) {
      case 'stop':
        // Stop recording
        const endTime = new Date();
        const duration = Math.floor(
          (endTime.getTime() - recording.startTime.getTime()) / 1000
        );

        updatedRecording = await db.recording.update({
          where: { id: recordingId },
          data: {
            endTime,
            duration,
            status: 'PROCESSING',
          },
        });
        break;

      case 'complete':
        // Mark as ready with URL
        updatedRecording = await db.recording.update({
          where: { id: recordingId },
          data: {
            url,
            thumbnail,
            status: 'READY',
          },
        });
        break;

      case 'fail':
        // Mark as failed
        updatedRecording = await db.recording.update({
          where: { id: recordingId },
          data: {
            status: 'FAILED',
          },
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { recording: updatedRecording },
    });
  } catch (error) {
    console.error('Recording update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recording' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Delete Recording
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const recordingId = searchParams.get('id');

    if (!recordingId) {
      return NextResponse.json(
        { success: false, error: 'Recording ID required' },
        { status: 400 }
      );
    }

    // Find and verify ownership
    const recording = await db.recording.findFirst({
      where: {
        id: recordingId,
        userId: session.user.id,
      },
    });

    if (!recording) {
      return NextResponse.json(
        { success: false, error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Delete recording
    await db.recording.delete({
      where: { id: recordingId },
    });

    // TODO: Also delete from storage (S3, etc.)

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error('Recording delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recording' },
      { status: 500 }
    );
  }
}
