import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { DateTimeSelection} from '@/types/session';
import { Friend } from '@/types/user';

const isValidInput = (data: unknown): data is { dates: DateTimeSelection[]; selectedFriends: Friend[] } => {
  return (
    typeof data === 'object' && 
    data !== null &&
    'dates' in data && 
    Array.isArray((data as { dates: unknown }).dates) && 
    'selectedFriends' in data &&
    Array.isArray((data as { selectedFriends: unknown }).selectedFriends) && 
    (data as { dates: unknown[] }).dates.every((d: unknown) =>
      typeof d === 'object' && d !== null && 'date' in d && 'hours' in d && 
      typeof (d as { date: unknown }).date === 'string' && 
      ((d as { hours: unknown }).hours === 'all' || 
        (Array.isArray((d as { hours: unknown }).hours) && 
         (d as { hours: unknown[] }).hours.every((h: unknown) => typeof h === 'number')))
    ) &&
    (data as { selectedFriends: unknown[] }).selectedFriends.every((f: unknown) => 
      typeof f === 'object' && f !== null && 'uid' in f && 'username' in f && 
      typeof (f as { uid: unknown }).uid === 'string' &&
      typeof (f as { username: unknown }).username === 'string'
    )
  );
};

export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.username) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const creatorUid = userProfile.uid;
    const creatorUsername = userProfile.username;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!isValidInput(body)) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }
    const { dates, selectedFriends }: { dates: DateTimeSelection[]; selectedFriends: Friend[] } = body;

    const friendsRef = adminDb.doc(`users/${creatorUid}/friends/data`);
    const friendsDoc = await friendsRef.get();
    const actualFriendsList = friendsDoc.exists ? friendsDoc.data()?.friendsList || {} : {}; 

    const selectedFriendUids = selectedFriends.map((f: Friend) => f.uid);
    let allSelectedAreFriends = true;
    const nonFriendUids: string[] = [];

    for (const selectedUid of selectedFriendUids) {
      if (!actualFriendsList.hasOwnProperty(selectedUid)) {
        allSelectedAreFriends = false;
        nonFriendUids.push(selectedUid);
      }
    }

    if (!allSelectedAreFriends) {
      console.warn(`User ${creatorUid} attempted to create session with non-friends: ${nonFriendUids.join(', ')}`);
      return NextResponse.json({ error: 'Cannot create session with non-friends' }, { status: 403 });
    }

    const participants: Record<string, { username: string; status: 'invited' | 'accepted' | 'declined' }> = {
      [creatorUid]: {
        username: creatorUsername,
        status: 'accepted'
      }
    };
    selectedFriends.forEach(friend => {
      participants[friend.uid] = {
        username: friend.username,
        status: 'invited'
      };
    });

    const participantIds = [creatorUid, ...selectedFriendUids];

    const userDatesFirestore = {
      [creatorUsername]: dates.map(({ date, hours }) => {
        const dateObj = new Date(date); 
        return {
          date: Timestamp.fromDate(dateObj),
          hours: hours === 'all' ? 'all' : hours.map(h => {
            const hourDate = new Date(dateObj);
            hourDate.setHours(h, 0, 0, 0);
            return Timestamp.fromDate(hourDate);
          })
        };
      })
    };

    const newSessionData = {
      createdAt: FieldValue.serverTimestamp(),
      createdBy: creatorUsername,
      createdByUid: creatorUid,
      userDates: userDatesFirestore,
      participants,
      participantIds,
      status: 'active'
    };

    const newSessionRef = await adminDb.collection('sessions').add(newSessionData);

    return NextResponse.json({ sessionId: newSessionRef.id }, { status: 201 });

  } catch (error: unknown) { 
    console.error('Error creating session via API:', error);
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
