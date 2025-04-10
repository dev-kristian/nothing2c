import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, deleteField, increment, getDoc, updateDoc } from 'firebase/firestore';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;

    const body = await request.json();
    const { friendId } = body; // Only expect friendId from body

    if (!friendId) {
      return NextResponse.json(
        { error: 'Missing friend ID' },
        { status: 400 }
      );
    }

    // Prevent removing self
    if (authenticatedUserId === friendId) {
        return NextResponse.json(
            { error: 'Cannot remove yourself as a friend' },
            { status: 400 }
        );
    }

    // --- Update Current User's Data ---
    const currentUserBatch = writeBatch(db);
    const currentUserFriendsRef = doc(db, 'users', authenticatedUserId, 'friends', 'data');
    // Also attempt to delete any lingering request doc (might not exist, that's okay)
    const receivedRequestRef = doc(db, 'users', authenticatedUserId, 'friendRequests', friendId);

    currentUserBatch.update(currentUserFriendsRef, {
      [`friendsList.${friendId}`]: deleteField(),
      totalFriends: increment(-1),
      // Clean up potential lingering request markers
      [`sentRequests.${friendId}`]: deleteField(),
      [`receivedRequests.${friendId}`]: deleteField()
    });
    currentUserBatch.delete(receivedRequestRef); // Delete potential incoming request doc

    try {
      await currentUserBatch.commit();
      console.log(`Successfully removed friend ${friendId} from user ${authenticatedUserId}'s data.`);
    } catch (currentUserError) {
      console.error(`Error cleaning up current user's (${authenticatedUserId}) data for friend ${friendId}:`, currentUserError);
      // If this fails, the friend wasn't removed from the current user's perspective.
      return NextResponse.json(
        { error: 'Failed to remove friend from your list.' },
        { status: 500 }
      );
    }

    // --- Attempt to Update Removed Friend's Data (Non-critical) ---
    const friendFriendsRef = doc(db, 'users', friendId, 'friends', 'data');
    // Also attempt to delete any lingering request doc sent by the current user to the friend
    const sentRequestRef = doc(db, 'users', friendId, 'friendRequests', authenticatedUserId);

    try {
      // Use a separate batch or individual operations for the friend's cleanup
      // Attempt to delete the request doc first
      await writeBatch(db).delete(sentRequestRef).commit();
      console.log(`Attempted deletion of potentially existing sent request doc: ${sentRequestRef.path}`);

      // Then attempt to update the friend's data document
      const friendFriendsDoc = await getDoc(friendFriendsRef);
      if (friendFriendsDoc.exists()) {
        await updateDoc(friendFriendsRef, {
          [`friendsList.${authenticatedUserId}`]: deleteField(),
          totalFriends: increment(-1),
          // Clean up potential lingering request markers
          [`sentRequests.${authenticatedUserId}`]: deleteField(),
          [`receivedRequests.${authenticatedUserId}`]: deleteField()
        });
        console.log(`Successfully updated removed friend ${friendId}'s data.`);
      } else {
        console.log(`Removed friend ${friendId}'s friends/data document does not exist. Skipping update.`);
      }
    } catch (friendCleanupError) {
      // Log this error but don't fail the request, as the primary goal (removing from current user) succeeded.
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
