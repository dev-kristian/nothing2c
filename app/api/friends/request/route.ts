// app/api/friends/request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentUser, targetUser } = body;

    if (!currentUser?.uid || !targetUser?.uid) {
      return NextResponse.json(
        { error: 'Missing required user information' },
        { status: 400 }
      );
    }

    const currentUserFriendsRef = doc(db, 'users', currentUser.uid, 'friends', 'data');
    await setDoc(currentUserFriendsRef, {
      sentRequests: {
        [targetUser.uid]: true
      }
    }, { merge: true });

    const targetUserFriendsRef = doc(db, 'users', targetUser.uid, 'friends', 'data');
    await setDoc(targetUserFriendsRef, {
      receivedRequests: {
        [currentUser.uid]: true
      }
    }, { merge: true });

    const requestRef = doc(db, 'users', targetUser.uid, 'friendRequests', currentUser.uid);
    await setDoc(requestRef, {
      fromUid: currentUser.uid,
      fromUsername: currentUser.username,
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
