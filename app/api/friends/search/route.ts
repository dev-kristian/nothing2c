// app/api/friends/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore'; // Added orderBy, limit
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { FriendSearchResultWithStatus } from '@/types'; // Import the type

// Define the possible friendship statuses
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

    if (!username) { // Only username is required from query now
      return NextResponse.json(
        { error: 'Missing username parameter' },
        { status: 400 }
      );
    }

    const usersRef = collection(db, 'users');
    // Add orderBy and limit for better performance and relevance
    // Note: This query requires a composite index on username (Ascending)
    // Firebase will prompt to create it if it doesn't exist.
    const q = query(
      usersRef,
      where('username', '>=', username),
      where('username', '<=', username + '\uf8ff'),
      orderBy('username'), // Order results alphabetically
      limit(15) // Limit results to avoid fetching too many
    );

    const querySnapshot = await getDocs(q);

    // Fetch the current user's friends/requests data *once*
    const friendsRef = doc(db, 'users', authenticatedUserId, 'friends', 'data');
    const friendsDoc = await getDoc(friendsRef);
    const friendsData = friendsDoc.exists() ? friendsDoc.data() : {};
    const friendsList = friendsData?.friendsList || {};
    const sentRequests = friendsData?.sentRequests || {};
    const receivedRequests = friendsData?.receivedRequests || {};

    // Process search results
    const users: FriendSearchResultWithStatus[] = querySnapshot.docs
      .map(doc => {
        const userData = doc.data();
        const uid = doc.id;

        // Determine friendship status
        let friendshipStatus: FriendshipStatus = 'none';
        if (friendsList[uid]) {
          friendshipStatus = 'friends';
        } else if (sentRequests[uid]) {
          friendshipStatus = 'pending_sent';
        } else if (receivedRequests[uid]) {
          friendshipStatus = 'pending_received';
        }

        return {
          uid: uid,
          username: userData.username || 'unknown user',
          photoURL: userData.photoURL || undefined, // Include photoURL
          friendshipStatus: friendshipStatus,
        };
      })
      .filter(user => user.uid !== authenticatedUserId); // Exclude self from search results

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}
