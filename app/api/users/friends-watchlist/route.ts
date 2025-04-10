import { NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { FirestoreWatchlistItem, FriendsWatchlistItem } from '@/types';

export const dynamic = 'force-dynamic'; // Force dynamic rendering

// Removed fetchWatchlistForUser as we'll fetch in batch

const processWatchlistItems = (
    allItems: FirestoreWatchlistItem[],
    mediaType: 'movie' | 'tv'
): FriendsWatchlistItem[] => {
    const watchlistCounts: { [id: number]: number } = {};
    const uniqueItemsMap: Map<number, FirestoreWatchlistItem> = new Map();

    allItems.forEach(item => {
        if (item.media_type === mediaType && typeof item.id === 'number') {
            watchlistCounts[item.id] = (watchlistCounts[item.id] || 0) + 1;
            if (!uniqueItemsMap.has(item.id)) {
                uniqueItemsMap.set(item.id, item);
            }
        }
    });

    const processedItems: FriendsWatchlistItem[] = Array.from(uniqueItemsMap.values())
        .filter(item => typeof item.vote_average === 'number' && item.vote_average > 0) 
        .map(item => ({
            ...item,
            vote_average: item.vote_average as number,
            watchlist_count: watchlistCounts[item.id] || 0,
            weighted_score: item.vote_average as number 
        }))
        .sort((a, b) => b.vote_average - a.vote_average);

    return processedItems;
};

export async function GET() {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userProfile.uid;

    const friendsRef = adminDb.doc(`users/${userId}/friends/data`);
    const friendsDoc = await friendsRef.get();
    const actualFriendsList = friendsDoc.exists ? friendsDoc.data()?.friendsList || {} : {};
    const friendIds = Object.keys(actualFriendsList);

    const allUserIds = [userId, ...friendIds];

    let combinedMovies: FirestoreWatchlistItem[] = [];
    let combinedTv: FirestoreWatchlistItem[] = [];

    if (allUserIds.length > 0) {
      // Create document references for all required watchlists
      const watchlistRefs = allUserIds.map(id => adminDb.doc(`watchlists/${id}`));

      // Fetch all watchlist documents in a single batch using getAll
      const watchlistSnapshots = await adminDb.getAll(...watchlistRefs);

      // Process the results from getAll
      watchlistSnapshots.forEach(docSnap => {
        if (docSnap.exists) {
          const data = docSnap.data();
          if (data) {
            combinedMovies = combinedMovies.concat((data.movie || []) as FirestoreWatchlistItem[]);
            combinedTv = combinedTv.concat((data.tv || []) as FirestoreWatchlistItem[]);
          }
        }
        // Optionally handle cases where a friend's watchlist doc doesn't exist
        // else { console.log(`Watchlist for user ${docSnap.ref.id} not found.`); }
      });
    }

    // Process the combined lists
    const topMovies = processWatchlistItems(combinedMovies, 'movie');
    const topTv = processWatchlistItems(combinedTv, 'tv');

    return NextResponse.json({ movie: topMovies, tv: topTv }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error fetching friends watchlist via API:`, error);
    return NextResponse.json({ error: 'Failed to fetch friends watchlist' }, { status: 500 });
  }
}
