import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin'; // Import admin for FieldValue
import { Session, Poll } from '@/types'; // Import Poll type
import { FieldValue } from 'firebase-admin/firestore';

// New validation function for mediaId input
const isValidMediaIdInput = (data: unknown): data is { mediaId: number } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'mediaId' in data &&
    typeof (data as { mediaId: unknown }).mediaId === 'number'
  );
};

export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.uid || !userProfile.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userProfile.uid;
    const username = userProfile.username;

    const sessionRef = adminDb.doc(`sessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data() as Session | undefined;

    // Check if Session is Completed
    if (sessionData?.status === 'completed') {
      return NextResponse.json({ error: 'Cannot vote in a completed session poll' }, { status: 403 }); // Forbidden
    }

    const participantInfo = sessionData?.participants?.[userId];

    if (!participantInfo) {
      console.warn(`User ${userId} (${username}) attempted to vote in session ${sessionId} they are not part of.`);
      return NextResponse.json({ error: 'Forbidden: User is not a participant' }, { status: 403 });
    }

    if (participantInfo.status !== 'accepted') {
        console.warn(`User ${userId} (${username}) attempted to vote in session ${sessionId} with status '${participantInfo.status}'.`);
        return NextResponse.json({ error: 'Forbidden: User must accept the invitation before voting.' }, { status: 403 });
    }

    if (!sessionData?.poll) { 
      return NextResponse.json({ error: 'Poll does not exist or has no items for this session' }, { status: 404 });
    }

    let mediaId: number;
    try {
      const body = await request.json();
      if (!isValidMediaIdInput(body)) {
        return NextResponse.json({ error: 'Invalid input data: mediaId must be a number.' }, { status: 400 });
      }
      mediaId = body.mediaId;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Check if the mediaId exists in the poll's mediaItems
    const pollData = sessionData.poll as Poll; // Cast to updated Poll type
    const itemExists = pollData.mediaItems.some(item => item.id === mediaId);

    if (!itemExists) {
        return NextResponse.json({ error: 'Media item not found in the poll' }, { status: 404 });
    }

    // Use userId as the key for poll votes
    const userVotesPath = `poll.votes.${userId}`;
    // Votes are now arrays of numbers (media IDs)
    const currentUserVotes: number[] = pollData.votes?.[userId] || [];

    let updateOperation;
    if (currentUserVotes.includes(mediaId)) {
      // User has voted for this item, remove the vote
      updateOperation = FieldValue.arrayRemove(mediaId);
    } else {
      // User has not voted for this item, add the vote
      updateOperation = FieldValue.arrayUnion(mediaId);
    }

    await sessionRef.update({
      [userVotesPath]: updateOperation
    });

    return NextResponse.json({ message: 'Vote toggled successfully' }, { status: 200 });

  } catch (error: unknown) { 
    console.error(`Error toggling vote for session ${params.sessionId} via API:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to toggle vote' }, { status: 500 });
  }
}
