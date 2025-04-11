import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, deleteField, getDoc } from 'firebase/firestore';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;

    const body = await request.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json(
        { error: 'Missing friend ID' },
        { status: 400 }
      );
    }

    if (authenticatedUserId === friendId) {
        return NextResponse.json(
            { error: 'Cannot remove yourself as a friend' },
            { status: 400 }
        );
    }

    const currentUserBatch = writeBatch(db);
    const currentUserFriendsRef = doc(db, 'users', authenticatedUserId, 'friends', 'data');
    const currentUserFriendOfRef = doc(db, 'users', authenticatedUserId, 'friendOf', friendId);
    const receivedRequestRef = doc(db, 'users', authenticatedUserId, 'friendRequests', friendId);

    currentUserBatch.update(currentUserFriendsRef, {
      [`friendsList.${friendId}`]: deleteField()
    });
    currentUserBatch.delete(currentUserFriendOfRef);
    currentUserBatch.delete(receivedRequestRef);

    try {
      await currentUserBatch.commit();
      console.log(`Successfully removed friend ${friendId} from user ${authenticatedUserId}'s data.`);
    } catch (currentUserError) {
      console.error(`Error cleaning up current user's (${authenticatedUserId}) data for friend ${friendId}:`, currentUserError);
      return NextResponse.json(
        { error: 'Failed to remove friend from your list.' },
        { status: 500 }
      );
    }

    const friendBatch = writeBatch(db);
    const friendFriendsRef = doc(db, 'users', friendId, 'friends', 'data');
    const friendFriendOfRef = doc(db, 'users', friendId, 'friendOf', authenticatedUserId);
    const sentRequestRef = doc(db, 'users', friendId, 'friendRequests', authenticatedUserId);

    const friendFriendsDoc = await getDoc(friendFriendsRef);
    if (friendFriendsDoc.exists()) {
        friendBatch.update(friendFriendsRef, {
          [`friendsList.${authenticatedUserId}`]: deleteField()
        });
    } else {
         console.log(`Removed friend ${friendId}'s friends/data document does not exist. Skipping update.`);
    }
    friendBatch.delete(friendFriendOfRef);
    friendBatch.delete(sentRequestRef);

    try {
      await friendBatch.commit();
      console.log(`Successfully cleaned up removed friend ${friendId}'s data.`);
    } catch (friendCleanupError) {
      console.error(`Non-critical error cleaning up removed friend's (${friendId}) data for user ${authenticatedUserId}:`, friendCleanupError);
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
