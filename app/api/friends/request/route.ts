// app/api/friends/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile?.uid || !userProfile?.username) {
      return NextResponse.json({ error: 'Unauthorized or user profile incomplete' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;
    const authenticatedUsername = userProfile.username;

    const body = await request.json();
    const { targetUser } = body;

    if (!targetUser?.uid) {
      return NextResponse.json(
        { error: 'Missing target user information' },
        { status: 400 }
      );
    }

    if (authenticatedUserId === targetUser.uid) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }
    const requestRef = doc(db, 'users', targetUser.uid, 'friendRequests', authenticatedUserId);
    await setDoc(requestRef, {
      fromUid: authenticatedUserId,       
      fromUsername: authenticatedUsername,
      fromPhotoURL: userProfile.photoURL || null,
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
