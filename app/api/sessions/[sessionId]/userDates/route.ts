import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';

import { UserDate } from '@/types'; 


const isValidEpochDatesInput = (data: unknown): data is { dates: UserDate[] } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'dates' in data &&
    Array.isArray((data as { dates: unknown }).dates) &&
    (data as { dates: unknown[] }).dates.every((d: unknown) =>
      typeof d === 'object' && d !== null && 
      'dateEpoch' in d && typeof (d as { dateEpoch: unknown }).dateEpoch === 'number' &&
      'hoursEpoch' in d &&
      // Ensure hoursEpoch is an array of numbers
      (Array.isArray((d as { hoursEpoch: unknown }).hoursEpoch) &&
       (d as { hoursEpoch: unknown[] }).hoursEpoch.every((h: unknown) => typeof h === 'number'))
    )
  );
};

export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  let body; 
  try {
    const sessionId = params.sessionId;
    if (!sessionId) {
      console.error("Missing sessionId in PUT request");
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.username || !userProfile.uid) {
      console.error(`Unauthorized attempt to update dates for session ${sessionId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userProfile.uid;
    const username = userProfile.username;

    
    try {
      body = await request.json();
    } catch (e) { 
      console.error(`Error parsing JSON body for session ${sessionId}:`, e);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    
    if (!isValidEpochDatesInput(body)) { 
      console.error(`Invalid input data format for session ${sessionId}. Received:`, JSON.stringify(body, null, 2)); 
      return NextResponse.json({ error: 'Invalid input data format for dates (expected epoch format)' }, { status: 400 });
    }
    
    const { dates }: { dates: UserDate[] } = body; 

    const sessionRef = adminDb.doc(`sessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();

    
    if (sessionData?.status === 'completed') {
      return NextResponse.json({ error: 'Cannot update dates for a completed session' }, { status: 403 }); 
    }

    const participantInfo = sessionData?.participants?.[userId];

    if (!participantInfo) {
      console.warn(`User ${userId} (${username}) attempted to update dates for session ${sessionId} they are not part of.`);
      return NextResponse.json({ error: 'Forbidden: User is not a participant in this session' }, { status: 403 });
    }

    if (participantInfo.status !== 'accepted') {
      console.warn(`User ${userId} (${username}) attempted to update dates for session ${sessionId} with status '${participantInfo.status}'.`);
      return NextResponse.json({ error: 'Forbidden: User must accept the invitation before updating availability.' }, { status: 403 });
    }

    
    

    // Use userId as the key for updating user dates
    const updatePayload = {
      [`userDates.${userId}`]: dates
    };

    await sessionRef.update(updatePayload);

    return NextResponse.json({ message: 'User dates updated successfully' }, { status: 200 });

    } catch (error: unknown) { 
    console.error(`Error processing PUT /api/sessions/${params.sessionId}/userDates:`, error);
    console.error("Request body was:", JSON.stringify(body, null, 2)); 
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to update user dates' }, { status: 500 });
  }
}
