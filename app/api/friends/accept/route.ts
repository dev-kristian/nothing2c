// app/api/friends/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, increment, deleteField } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentUserId, requesterId, requesterUsername, currentUsername } = body;

    if (!currentUserId || !requesterId || !requesterUsername || !currentUsername) {
      return NextResponse.json(
        { error: 'Missing required information' },
        { status: 400 }
      );
    }

    const batch = writeBatch(db);

    // Update request status
    const requestRef = doc(db, 'users', currentUserId, 'friendRequests', requesterId);
    batch.update(requestRef, { status: 'accepted' });

    // Add to current user's friends list
    const currentUserFriendsRef = doc(db, 'users', currentUserId, 'friends', 'data');
    batch.set(currentUserFriendsRef, {
      friendsList: { [requesterId]: true },
      totalFriends: increment(1),
      receivedRequests: { [requesterId]: deleteField() }
    }, { merge: true });

    // Add to requester's friends list
    const requesterFriendsRef = doc(db, 'users', requesterId, 'friends', 'data');
    batch.set(requesterFriendsRef, {
      friendsList: { [currentUserId]: true },
      totalFriends: increment(1),
      sentRequests: { [currentUserId]: deleteField() }
    }, { merge: true });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json(
      { error: 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}
