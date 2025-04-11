// app/api/friends/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Add this line

import { adminDb as db } from '@/lib/firebase-admin';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { FriendSearchResultWithStatus } from '@/types';

type FriendshipStatus = 'friends' | 'pending_sent' | 'pending_received' | 'none';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const authenticatedUserId = userProfile.uid;

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) { 
      return NextResponse.json(
        { error: 'Missing username parameter' },
        { status: 400 }
      );
    }

    const usersRef = db.collection('users');
    const q = usersRef
      .where('username', '>=', username)
      .where('username', '<=', username + '\uf8ff')
      .orderBy('username') 
      .limit(15);

    const querySnapshot = await q.get();

    const friendsRef = db.collection('users').doc(authenticatedUserId).collection('friends').doc('data');
    const friendsDoc = await friendsRef.get();
    const friendsData = friendsDoc.exists ? friendsDoc.data() : {};
    const friendsList = friendsData?.friendsList || {}; 

    const receivedRequestsQuery = db.collection('users').doc(authenticatedUserId).collection('friendRequests')
      .where('status', '==', 'pending');

    const receivedRequestsSnapshot = await receivedRequestsQuery.get();
    const receivedRequestSenders = new Set(receivedRequestsSnapshot.docs.map(doc => doc.data().fromUid));

    const userPromises = querySnapshot.docs
      .filter(doc => doc.id !== authenticatedUserId)
      .map(async (doc: QueryDocumentSnapshot): Promise<FriendSearchResultWithStatus | null> => {
        const userData = doc.data();
        const uid = doc.id;

        let friendshipStatus: FriendshipStatus = 'none';

        if (friendsList[uid]) {
          friendshipStatus = 'friends';
        } else if (receivedRequestSenders.has(uid)) {
          friendshipStatus = 'pending_received';
        } else {
          const sentRequestRef = db.collection('users').doc(uid).collection('friendRequests').doc(authenticatedUserId);
          const sentRequestDoc = await sentRequestRef.get();
          const sentRequestData = sentRequestDoc.data();
          if (sentRequestDoc.exists && sentRequestData?.status === 'pending') {
            friendshipStatus = 'pending_sent';
          }
        }

        if (userData) {
            return {
              uid: uid,
              username: userData.username || 'unknown user',
              photoURL: userData.photoURL || undefined,
              friendshipStatus: friendshipStatus,
            };
        }
        return null; 
      });

    const usersWithStatus = (await Promise.all(userPromises))
        .filter((user): user is FriendSearchResultWithStatus => user !== null);

    return NextResponse.json({ users: usersWithStatus });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
