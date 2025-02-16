// app/api/friends/remove/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, deleteField, increment } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentUserId, friendId } = body;

    if (!currentUserId || !friendId) {
      return NextResponse.json(
        { error: 'Missing required information' },
        { status: 400 }
      );
    }

    const batch = writeBatch(db);

    // Remove from current user's friends list
    const currentUserFriendsRef = doc(db, 'users', currentUserId, 'friends', 'data');
    batch.update(currentUserFriendsRef, {
      [`friendsList.${friendId}`]: deleteField(),
      totalFriends: increment(-1)
    });

    // Remove from friend's friends list
    const friendFriendsRef = doc(db, 'users', friendId, 'friends', 'data');
    batch.update(friendFriendsRef, {
      [`friendsList.${currentUserId}`]: deleteField(),
      totalFriends: increment(-1)
    });

    // Clean up friend request documents
    const sentRequestRef = doc(db, 'users', friendId, 'friendRequests', currentUserId);
    batch.delete(sentRequestRef);

    const receivedRequestRef = doc(db, 'users', currentUserId, 'friendRequests', friendId);
    batch.delete(receivedRequestRef);

    // Clean up any pending requests in friends data
    batch.update(currentUserFriendsRef, {
      [`sentRequests.${friendId}`]: deleteField(),
      [`receivedRequests.${friendId}`]: deleteField()
    });

    batch.update(friendFriendsRef, {
      [`sentRequests.${currentUserId}`]: deleteField(),
      [`receivedRequests.${currentUserId}`]: deleteField()
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}
