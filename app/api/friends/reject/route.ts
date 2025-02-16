// app/api/friends/reject/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, deleteField } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentUserId, requesterId } = body;

    if (!currentUserId || !requesterId) {
      return NextResponse.json(
        { error: 'Missing required information' },
        { status: 400 }
      );
    }

    const batch = writeBatch(db);

    // Update request status
    const requestRef = doc(db, 'users', currentUserId, 'friendRequests', requesterId);
    batch.update(requestRef, { status: 'rejected' });

    // Remove from received requests
    const currentUserFriendsRef = doc(db, 'users', currentUserId, 'friends', 'data');
    batch.set(currentUserFriendsRef, {
      receivedRequests: { [requesterId]: deleteField() }
    }, { merge: true });

    // Remove from sent requests
    const requesterFriendsRef = doc(db, 'users', requesterId, 'friends', 'data');
    batch.set(requesterFriendsRef, {
      sentRequests: { [currentUserId]: deleteField() }
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
