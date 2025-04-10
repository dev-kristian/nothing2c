// app/api/friends/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid || !userProfile?.username) { // Ensure we have uid and username
      return NextResponse.json({ error: 'Unauthorized or user profile incomplete' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;
    const authenticatedUsername = userProfile.username;

    const body = await request.json();
    const { targetUser } = body; // Only expect targetUser from body

    if (!targetUser?.uid) { // Only validate targetUser
      return NextResponse.json(
        { error: 'Missing target user information' },
        { status: 400 }
      );
    }

    // Prevent sending request to self
    if (authenticatedUserId === targetUser.uid) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Use authenticatedUserId for current user's data
    const currentUserFriendsRef = doc(db, 'users', authenticatedUserId, 'friends', 'data');
    await setDoc(currentUserFriendsRef, {
      sentRequests: {
        [targetUser.uid]: true
      }
    }, { merge: true });

    // Use targetUser.uid for target user's data
    const targetUserFriendsRef = doc(db, 'users', targetUser.uid, 'friends', 'data');
    await setDoc(targetUserFriendsRef, {
      receivedRequests: {
        [authenticatedUserId]: true // Use authenticatedUserId here
      }
    }, { merge: true });

    // Use targetUser.uid and authenticatedUserId for the request document path
    const requestRef = doc(db, 'users', targetUser.uid, 'friendRequests', authenticatedUserId);
    await setDoc(requestRef, {
      fromUid: authenticatedUserId,       // Use authenticatedUserId
      fromUsername: authenticatedUsername, // Use authenticatedUsername
      status: 'pending',
      timestamp: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}
