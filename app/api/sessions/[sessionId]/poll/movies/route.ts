import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { Session } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

const isValidMovieTitleInput = (data: unknown): data is { movieTitle: string } => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  return (
    'movieTitle' in data &&
    typeof (data as { movieTitle: unknown }).movieTitle === 'string' &&
    (data as { movieTitle: string }).movieTitle.trim() !== ''
  );
};

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
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

    const sessionRef = adminDb.doc(`sessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data() as Session | undefined;
    const participantIds = sessionData?.participantIds || [];

    if (!participantIds.includes(userId)) {
      console.warn(`User ${userId} attempted to add movie to poll for session ${sessionId} they are not part of.`);
      return NextResponse.json({ error: 'Forbidden: User is not a participant' }, { status: 403 });
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

    if (sessionData.poll.movieTitles.includes(movieTitle)) {
        return NextResponse.json({ error: 'Movie title already exists in the poll' }, { status: 409 }); 
    }

    await sessionRef.update({
      'poll.movieTitles': FieldValue.arrayUnion(movieTitle)
    });

    return NextResponse.json({ message: 'Movie added to poll successfully' }, { status: 200 });

  } catch (error: unknown) { // Change 'any' to 'unknown'
    console.error(`Error adding movie to poll for session ${params.sessionId} via API:`, error);
    // Type check for Firestore error code
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to add movie to poll' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { sessionId: string } }) {
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

    const sessionRef = adminDb.doc(`sessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data() as Session | undefined;
    const participantIds = sessionData?.participantIds || [];

    if (!participantIds.includes(userId)) {
      console.warn(`User ${userId} attempted to remove movie from poll for session ${sessionId} they are not part of.`);
      return NextResponse.json({ error: 'Forbidden: User is not a participant' }, { status: 403 });
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

    const votePath = `poll.votes.${movieTitle.replace(/\./g, '_')}`; // Firestore map keys cannot contain '.' - need to handle this if titles can have periods. Assuming simple titles for now. If titles have '.', a different approach for votes might be needed (e.g., encoding the title or using a subcollection). Let's assume simple titles.

    await sessionRef.update({
      'poll.movieTitles': FieldValue.arrayRemove(movieTitle),
      [votePath]: FieldValue.delete() 
    });

    return NextResponse.json({ message: 'Movie removed from poll successfully' }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error removing movie from poll for session ${params.sessionId} via API:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to remove movie from poll' }, { status: 500 });
  }
}
