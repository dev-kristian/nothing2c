// app/api/friends/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;

    const body = await request.json();
    const { requesterId } = body;

    if (!requesterId) {
      return NextResponse.json(
        { error: 'Missing requester ID' },
        { status: 400 }
      );
    }

    if (authenticatedUserId === requesterId) {
        return NextResponse.json(
            { error: 'Invalid operation' },
            { status: 400 }
        );
    }

    const batch = writeBatch(db);

    const requestRef = doc(db, 'users', authenticatedUserId, 'friendRequests', requesterId);
    batch.delete(requestRef);

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return NextResponse.json(
      { error: 'Failed to reject friend request' },
      { status: 500 }
    );
  }
}
