import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const isValidStatus = (status: unknown): status is 'accepted' | 'declined' => {
  return status === 'accepted' || status === 'declined';
};

export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userProfile.uid;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const status = body?.status;
    if (!isValidStatus(status)) {
      return NextResponse.json({ error: 'Invalid status provided. Must be "accepted" or "declined".' }, { status: 400 });
    }

    const sessionRef = adminDb.doc(`sessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    if (!sessionData?.participants || !sessionData.participants[userId]) {
       console.warn(`User ${userId} attempted to update status for session ${sessionId} they are not part of.`);
       console.warn(`User ${userId} attempted to update status for session ${sessionId} they are not part of.`);
       return NextResponse.json({ error: 'Forbidden: User is not a participant in this session' }, { status: 403 });
    }

    let updatePayload = {};
    if (status === 'accepted') {
      // Update status to accepted
      updatePayload = {
        [`participants.${userId}.status`]: 'accepted'
      };
    } else if (status === 'declined') {
      // Remove participant entirely
      updatePayload = {
        [`participants.${userId}`]: FieldValue.delete(), // Remove from map
        participantIds: FieldValue.arrayRemove(userId) // Remove from array
      };
    } else {
      // Should not happen due to isValidStatus check, but handle defensively
      return NextResponse.json({ error: 'Invalid status operation' }, { status: 400 });
    }


    await sessionRef.update(updatePayload);

    return NextResponse.json({ message: `Participant status updated successfully (${status})` }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error updating participant status for session ${params.sessionId} via API:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to update participant status' }, { status: 500 });
  }
}
