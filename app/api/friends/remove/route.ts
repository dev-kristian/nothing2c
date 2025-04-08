import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, deleteField, increment, getDoc, updateDoc } from 'firebase/firestore';

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

    const currentUserBatch = writeBatch(db);
    const currentUserFriendsRef = doc(db, 'users', currentUserId, 'friends', 'data');
    const receivedRequestRef = doc(db, 'users', currentUserId, 'friendRequests', friendId);

    currentUserBatch.update(currentUserFriendsRef, {
      [`friendsList.${friendId}`]: deleteField(),
      totalFriends: increment(-1),
      [`sentRequests.${friendId}`]: deleteField(), 
      [`receivedRequests.${friendId}`]: deleteField() 
    });

    currentUserBatch.delete(receivedRequestRef);

    try {
      await currentUserBatch.commit();
      console.log(`Successfully removed friend ${friendId} from user ${currentUserId}'s data.`);
    } catch (currentUserError) {
      console.error(`Error cleaning up current user's (${currentUserId}) data for friend ${friendId}:`, currentUserError);
      return NextResponse.json(
        { error: 'Failed to remove friend from your list.' },
        { status: 500 }
      );
    }

    const friendFriendsRef = doc(db, 'users', friendId, 'friends', 'data');
    const sentRequestRef = doc(db, 'users', friendId, 'friendRequests', currentUserId);

    try {
      await writeBatch(db).delete(sentRequestRef).commit();
      console.log(`Attempted deletion of sent request doc: ${sentRequestRef.path}`);

      const friendFriendsDoc = await getDoc(friendFriendsRef);
      if (friendFriendsDoc.exists()) {
        await updateDoc(friendFriendsRef, {
          [`friendsList.${currentUserId}`]: deleteField(),
          totalFriends: increment(-1),
          [`sentRequests.${currentUserId}`]: deleteField(),
          [`receivedRequests.${currentUserId}`]: deleteField()
        });
        console.log(`Successfully updated friend ${friendId}'s data.`);
      } else {
        console.log(`Friend ${friendId}'s friends/data document does not exist. Skipping update.`);
      }
    } catch (friendCleanupError) {
      console.error(`Non-critical error cleaning up friend's (${friendId}) data for user ${currentUserId}:`, friendCleanupError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Unexpected error in remove friend endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}
