import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { DateTimeSelection } from '@/types';

const isValidDatesInput = (data: unknown): data is { dates: DateTimeSelection[] } => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'dates' in data &&
    Array.isArray((data as { dates: unknown }).dates) &&
    (data as { dates: unknown[] }).dates.every((d: unknown) =>
      typeof d === 'object' && d !== null && 'date' in d && 'hours' in d && 
      typeof (d as { date: unknown }).date === 'string' && 
      ((d as { hours: unknown }).hours === 'all' ||
        (Array.isArray((d as { hours: unknown }).hours) && 
         (d as { hours: unknown[] }).hours.every((h: unknown) => typeof h === 'number'))) 
    )
  );
};

export async function PUT(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.username || !userProfile.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userProfile.uid;
    const username = userProfile.username;

    let body;
    try {
      body = await request.json();
    } catch { 
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!isValidDatesInput(body)) {
      return NextResponse.json({ error: 'Invalid input data for dates' }, { status: 400 });
    }
    const { dates }: { dates: DateTimeSelection[] } = body;

    const sessionRef = adminDb.doc(`sessions/${sessionId}`);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    const participantIds = sessionData?.participantIds || [];

    if (!participantIds.includes(userId)) {
      console.warn(`User ${userId} (${username}) attempted to update dates for session ${sessionId} they are not part of.`);
      return NextResponse.json({ error: 'Forbidden: User is not a participant in this session' }, { status: 403 });
    }

    const userDatesFirestore = dates.map(({ date, hours }) => {
        const dateObj = new Date(date);
        return {
          date: Timestamp.fromDate(dateObj),
          hours: hours === 'all' ? 'all' : hours.map(h => {
            const hourDate = new Date(dateObj);
            hourDate.setHours(h, 0, 0, 0);
            return Timestamp.fromDate(hourDate);
          })
        };
      });

    const updatePayload = {
      [`userDates.${username}`]: userDatesFirestore
    };

    await sessionRef.update(updatePayload);

    return NextResponse.json({ message: 'User dates updated successfully' }, { status: 200 });

  } catch (error: unknown) { 
    console.error(`Error updating user dates for session via API:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to update user dates' }, { status: 500 });
  }
}
