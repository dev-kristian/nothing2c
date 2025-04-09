import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils'; // Use standard auth helper
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Session, Friend } from '@/types';

// Input validation helper
const isValidInput = (data: unknown): data is { friendsToInvite: Friend[] } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'friendsToInvite' in data &&
    Array.isArray((data as { friendsToInvite: unknown }).friendsToInvite) &&
    (data as { friendsToInvite: Friend[] }).friendsToInvite.length > 0 &&
    (data as { friendsToInvite: Friend[] }).friendsToInvite.every(
      (f) =>
        typeof f === 'object' &&
        f !== null &&
        typeof f.uid === 'string' &&
        typeof f.username === 'string'
    )
  );
};

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  // 1. Authentication
  const userProfile = await getAuthenticatedUserProfile();
  if (!userProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = userProfile.uid;

  // 2. Parse and Validate Input Body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!isValidInput(body)) {
    return NextResponse.json({ error: 'Invalid input data: requires friendsToInvite array' }, { status: 400 });
  }
  const { friendsToInvite }: { friendsToInvite: Friend[] } = body;

  try {
    const sessionRef = adminDb.collection('sessions').doc(sessionId);
    const friendsRef = adminDb.doc(`users/${currentUserId}/friends/data`); // Path to creator's friend list

    // Fetch session and friend list concurrently
    const [sessionDoc, friendsDoc] = await Promise.all([
        sessionRef.get(),
        friendsRef.get()
    ]);

    // 3. Session Existence Check
    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    const sessionData = sessionDoc.data() as Session;

    // 4. Authorization Check: Is user the creator?
    if (sessionData.createdByUid !== currentUserId) {
      return NextResponse.json({ error: 'Forbidden: Only the session creator can invite participants' }, { status: 403 });
    }

    // 5. Friend Validation Check: Are invited users still friends?
    const actualFriendsList = friendsDoc.exists ? friendsDoc.data()?.friendsList || {} : {};
    const invitedFriendUids = friendsToInvite.map((f) => f.uid);
    const nonFriendUids: string[] = [];

    for (const invitedUid of invitedFriendUids) {
      if (!actualFriendsList.hasOwnProperty(invitedUid)) {
        nonFriendUids.push(invitedUid);
      }
    }

    if (nonFriendUids.length > 0) {
      console.warn(`User ${currentUserId} attempted to invite non-friends (${nonFriendUids.join(', ')}) to session ${sessionId}`);
      return NextResponse.json({ error: `Cannot invite users who are not friends: ${nonFriendUids.join(', ')}` }, { status: 403 });
    }

    // 6. Prepare Updates
    const updates: { [key: string]: { username: string; status: 'invited' } | 'invited' | FieldValue } = {};
    const newParticipantIds: string[] = [];

    friendsToInvite.forEach(friend => {
      // Only add if not already a participant (or overwrite if status was different)
      if (!sessionData.participants || !sessionData.participants[friend.uid]) {
         updates[`participants.${friend.uid}`] = {
           username: friend.username,
           status: 'invited',
         };
         newParticipantIds.push(friend.uid);
      } else if (sessionData.participants[friend.uid].status !== 'invited') {
         // If they exist but status is not 'invited', update it (e.g., re-inviting someone who declined?)
         // Consider if this behavior is desired. For now, we'll update.
         updates[`participants.${friend.uid}.status`] = 'invited';
         // No need to add to participantIds again if they already exist
      }
    });

    // Add new UIDs to the participantIds array if there are any new ones
    if (newParticipantIds.length > 0) {
        updates['participantIds'] = FieldValue.arrayUnion(...newParticipantIds);
    }

    // 7. Atomically Update Firestore (only if there are changes)
    if (Object.keys(updates).length > 0) {
        await sessionRef.update(updates);
    } else {
        // No actual changes needed (e.g., trying to invite already invited people)
        // Still return success as the state is effectively what was requested.
    }


    // Use standard success response (no message needed unless specifically useful)
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error(`Error inviting participants to session ${sessionId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    // Use standard error response format
    return NextResponse.json({ error: `Failed to invite participants: ${errorMessage}` }, { status: 500 });
  }
}
