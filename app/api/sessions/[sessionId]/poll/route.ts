import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { Session } from '@/types'; 

const isValidMovieTitlesInput = (data: unknown): data is { movieTitles: string[] } => {
  return (
    typeof data === 'object' && 
    data !== null &&
    'movieTitles' in data && 
    Array.isArray((data as { movieTitles: unknown }).movieTitles) && 
    (data as { movieTitles: unknown[] }).movieTitles.length > 0 && 
    (data as { movieTitles: unknown[] }).movieTitles.every(
      (title: unknown) => typeof title === 'string' && title.trim() !== '' 
    )
  );
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  try {
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

    // Check if Session is Completed
    if (sessionData?.status === 'completed') {
      return NextResponse.json({ error: 'Cannot create a poll for a completed session' }, { status: 403 }); // Forbidden
    }

    const participantIds = sessionData?.participantIds || [];

    if (!participantIds.includes(userId)) {
      console.warn(`User ${userId} attempted to create poll for session ${sessionId} they are not part of.`);
      return NextResponse.json({ error: 'Forbidden: User is not a participant' }, { status: 403 });
    }

    if (sessionData?.poll) {
        return NextResponse.json({ error: 'Poll already exists for this session' }, { status: 409 }); 
    }

    let body;
    try {
      body = await request.json();
    } catch { 
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!isValidMovieTitlesInput(body)) {
      return NextResponse.json({ error: 'Invalid input data: movieTitles must be a non-empty array of strings.' }, { status: 400 });
    }
    const { movieTitles }: { movieTitles: string[] } = body;


    const pollId = Math.random().toString(36).substring(2, 11); 
    const pollData = {
      id: pollId,
      movieTitles: movieTitles,
      votes: {}
    };

    await sessionRef.update({
      poll: pollData
    });

    return NextResponse.json({ message: 'Poll created successfully', pollId: pollId }, { status: 201 });

  } catch (error: unknown) { 
    console.error(`Error creating poll for session ${sessionId} via API:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}
