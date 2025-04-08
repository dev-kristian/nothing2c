// app/api/friends/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const currentUserId = searchParams.get('currentUserId');

    if (!username || !currentUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('username', '>=', username),
      where('username', '<=', username + '\uf8ff')
    );

    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map(doc => ({
      uid: doc.id,
      username: doc.data().username,
    }));

    const friendsRef = doc(db, 'users', currentUserId, 'friends', 'data');
    const friendsDoc = await getDoc(friendsRef);
    const friendsData = friendsDoc.data() || {};

    const usersWithStatus = await Promise.all(users.map(async (user) => {
      const requestStatus: {
        exists: boolean;
        type?: 'sent' | 'received';
        status?: 'pending' | 'accepted' | 'rejected';
      } = {
        exists: false,
        type: undefined,
        status: undefined
      };
        if (friendsData.sentRequests && friendsData.sentRequests[user.uid]) {
            requestStatus.exists = true;
            requestStatus.type = 'sent';
            requestStatus.status = 'pending';
        }
        if (friendsData.receivedRequests && friendsData.receivedRequests[user.uid]) {
          requestStatus.exists = true;
          requestStatus.type = 'received';
          requestStatus.status = 'pending';
      }

      return {
        ...user,
        requestStatus
      };
    }));

    return NextResponse.json({ users: usersWithStatus });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
