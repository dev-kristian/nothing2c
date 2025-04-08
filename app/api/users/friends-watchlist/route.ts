import { NextResponse } from 'next/server';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils';
import { adminDb } from '@/lib/firebase-admin';
import { FirestoreWatchlistItem, FriendsWatchlistItem } from '@/types';

export const dynamic = 'force-dynamic'; // Force dynamic rendering

const fetchWatchlistForUser = async (userId: string): Promise<{ movie: FirestoreWatchlistItem[], tv: FirestoreWatchlistItem[] }> => {
  try {
    const docRef = adminDb.doc(`watchlists/${userId}`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const movies = (data?.movie || []) as FirestoreWatchlistItem[];
      const tvShows = (data?.tv || []) as FirestoreWatchlistItem[];
      return { movie: movies, tv: tvShows };
    }
    return { movie: [], tv: [] };
  } catch (error) {
    console.error(`Error fetching watchlist items for user ${userId}:`, error);
    return { movie: [], tv: [] };
  }
};

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
    const watchlistPromises = allUserIds.map(id => fetchWatchlistForUser(id));
    const watchlistResults = await Promise.all(watchlistPromises);

    let combinedMovies: FirestoreWatchlistItem[] = [];
    let combinedTv: FirestoreWatchlistItem[] = [];
    watchlistResults.forEach(result => {
        combinedMovies = combinedMovies.concat(result.movie);
        combinedTv = combinedTv.concat(result.tv);
    });

    const topMovies = processWatchlistItems(combinedMovies, 'movie');
    const topTv = processWatchlistItems(combinedTv, 'tv');

    return NextResponse.json({ movie: topMovies, tv: topTv }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error fetching friends watchlist via API:`, error);
    return NextResponse.json({ error: 'Failed to fetch friends watchlist' }, { status: 500 });
  }
}
