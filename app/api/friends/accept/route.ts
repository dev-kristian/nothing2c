// app/api/friends/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, serverTimestamp } from 'firebase/firestore'; 
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';

export async function POST(request: NextRequest) {
  try {
    const acceptorProfile = await getAuthenticatedUserProfile();
    if (!acceptorProfile?.uid || !acceptorProfile?.username) {
      return NextResponse.json({ error: 'Unauthorized or acceptor profile incomplete' }, { status: 401 });
    }
    const authenticatedUserId = acceptorProfile.uid;
    const acceptorUsername = acceptorProfile.username;
    const acceptorPhotoURL = acceptorProfile.photoURL;

    const body = await request.json();
    const { requesterId } = body;

    if (!requesterId) {
      return NextResponse.json(
        { error: 'Missing requester ID' },
        { status: 400 }
      );
    }

    if (authenticatedUserId === requesterId) {
        return NextResponse.json(
            { error: 'Invalid operation' },
            { status: 400 }
      );
    }

    const requesterDocRef = doc(db, 'users', requesterId);
    const requesterDoc = await getDoc(requesterDocRef);
    if (!requesterDoc.exists()) {
        return NextResponse.json({ error: 'Requester user not found' }, { status: 404 });
    }
    const requesterProfile = requesterDoc.data();
    const requesterUsername = requesterProfile.username;
    const requesterPhotoURL = requesterProfile.photoURL;

    const batch = writeBatch(db);

    const requestRef = doc(db, 'users', authenticatedUserId, 'friendRequests', requesterId);
    batch.delete(requestRef);

    const acceptorFriendsRef = doc(db, 'users', authenticatedUserId, 'friends', 'data');
    batch.set(acceptorFriendsRef, {
      friendsList: {
        [requesterId]: {
          username: requesterUsername,
          photoURL: requesterPhotoURL || null
        }
      }
    }, { merge: true });

    const requesterFriendsRef = doc(db, 'users', requesterId, 'friends', 'data');
    batch.set(requesterFriendsRef, {
      friendsList: {
        [authenticatedUserId]: {
          username: acceptorUsername,
          photoURL: acceptorPhotoURL || null
        }
      }
    }, { merge: true });

    const acceptorFriendOfRef = doc(db, 'users', authenticatedUserId, 'friendOf', requesterId);
    batch.set(acceptorFriendOfRef, { addedAt: serverTimestamp() });

    const requesterFriendOfRef = doc(db, 'users', requesterId, 'friendOf', authenticatedUserId);
    batch.set(requesterFriendOfRef, { addedAt: serverTimestamp() });

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
