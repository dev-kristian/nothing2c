// app/api/friends/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, deleteField } from 'firebase/firestore';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;

    const body = await request.json();
    const { requesterId } = body; // Only expect requesterId from body

    if (!requesterId) {
      return NextResponse.json(
        { error: 'Missing requester ID' },
        { status: 400 }
      );
    }

    // Prevent rejecting self (edge case)
    if (authenticatedUserId === requesterId) {
        return NextResponse.json(
            { error: 'Invalid operation' },
            { status: 400 }
        );
    }

    const batch = writeBatch(db);

    // Use authenticatedUserId for the path
    const requestRef = doc(db, 'users', authenticatedUserId, 'friendRequests', requesterId);
    // Consider deleting instead of updating status? For now, keep update.
    batch.update(requestRef, { status: 'rejected' });

    // Use authenticatedUserId for current user's data
    const currentUserFriendsRef = doc(db, 'users', authenticatedUserId, 'friends', 'data');
    batch.set(currentUserFriendsRef, {
      receivedRequests: { [requesterId]: deleteField() } // Remove from received
    }, { merge: true });

    // Use requesterId for requester's data
    const requesterFriendsRef = doc(db, 'users', requesterId, 'friends', 'data');
    batch.set(requesterFriendsRef, {
      sentRequests: { [authenticatedUserId]: deleteField() } // Remove from their sent
    }, { merge: true });

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
