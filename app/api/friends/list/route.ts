// app/api/friends/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const friendsRef = doc(db, 'users', userId, 'friends', 'data');
    const friendsDoc = await getDoc(friendsRef);
    
    if (!friendsDoc.exists() || !friendsDoc.data().friendsList) {
      return NextResponse.json({ friends: [] });
    }

    const friendsList = friendsDoc.data().friendsList;
    const friendIds = Object.keys(friendsList);

    const friendsData = await Promise.all(
      friendIds.map(async (friendId) => {
        const userDoc = await getDoc(doc(db, 'users', friendId));
        return {
          uid: userDoc.id,
          ...userDoc.data()
        };
      })
    );

    return NextResponse.json({ friends: friendsData });
  } catch (error) {
    console.error('Error getting friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends list' },
      { status: 500 }
    );
  }
}
