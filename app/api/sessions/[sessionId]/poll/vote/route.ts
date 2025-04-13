import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { Session } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

const isValidMovieTitleInput = (data: unknown): data is { movieTitle: string } => {
  return (
    typeof data === 'object' &&
    data !== null && 
    'movieTitle' in data &&
    typeof (data as { movieTitle: unknown }).movieTitle === 'string' && 
    (data as { movieTitle: string }).movieTitle.trim() !== ''
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
        return NextResponse.json({ error: 'Poll does not exist for this session' }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!isValidMovieTitleInput(body)) {
      return NextResponse.json({ error: 'Invalid input data: movieTitle must be a non-empty string.' }, { status: 400 });
    }
    const { movieTitle }: { movieTitle: string } = body;

    if (!sessionData.poll.movieTitles.includes(movieTitle)) {
        return NextResponse.json({ error: 'Movie title not found in the poll' }, { status: 404 });
    }

    // Use userId as the key for poll votes
    const userVotesPath = `poll.votes.${userId}`;
    const currentUserVotes: string[] = sessionData.poll.votes?.[userId] || [];

    let updateOperation;
    if (currentUserVotes.includes(movieTitle)) {
      updateOperation = FieldValue.arrayRemove(movieTitle);
    } else {
      updateOperation = FieldValue.arrayUnion(movieTitle);
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
