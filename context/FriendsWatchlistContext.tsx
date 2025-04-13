'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirestoreWatchlistItem, FriendsWatchlistItem, Friend } from '@/types';
import { useAuthContext } from './AuthContext';
import { useFriendsContext } from './FriendsContext'; // Updated import
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe, DocumentSnapshot, FirestoreError } from 'firebase/firestore';

type FriendsWatchlistApiResponse = {
  movie: FriendsWatchlistItem[];
  tv: FriendsWatchlistItem[];
};

type UserWatchlistData = {
  movie: FirestoreWatchlistItem[];
  tv: FirestoreWatchlistItem[];
};

interface FriendsWatchlistContextType {
  friendsWatchlistItems: FriendsWatchlistApiResponse;
  isLoading: boolean;
  error: string | null;
}

const FriendsWatchlistContext = createContext<FriendsWatchlistContextType | undefined>(undefined);

export const useFriendsWatchlist = () => {
  const context = useContext(FriendsWatchlistContext);
  if (!context) {
    throw new Error('useFriendsWatchlist must be used within a FriendsWatchlistProvider');
  }
  return context;
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
      weighted_score: (item.vote_average as number) * (watchlistCounts[item.id] || 0)
    }))
    .sort((a, b) => {
        if (b.weighted_score !== a.weighted_score) {
            return b.weighted_score - a.weighted_score;
        }
        return b.vote_average - a.vote_average;
    });

  return processedItems;
};

export const FriendsWatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const { friends, isLoadingFriends } = useFriendsContext(); // Use new hook

  const [friendsWatchlistItems, setFriendsWatchlistItems] = useState<FriendsWatchlistApiResponse>({ movie: [], tv: [] });
  const [allWatchlistsData, setAllWatchlistsData] = useState<Map<string, UserWatchlistData>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setAllWatchlistsData(new Map()); 
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const userIdsToListen = [user.uid, ...friends.map((f: Friend) => f.uid)];
    const unsubscribes: Unsubscribe[] = [];

    userIdsToListen.forEach((userId: string) => { 
      const watchlistDocRef = doc(db, 'watchlists', userId);
      const unsubscribe = onSnapshot(watchlistDocRef,
        (docSnapshot: DocumentSnapshot) => { 
          const data = docSnapshot.data();
          const userWatchlist: UserWatchlistData = {
            movie: (data?.movie || []) as FirestoreWatchlistItem[],
            tv: (data?.tv || []) as FirestoreWatchlistItem[],
          };
          setAllWatchlistsData((prevMap: Map<string, UserWatchlistData>) => {
            const newMap = new Map(prevMap);
            newMap.set(userId, userWatchlist);
            return newMap;
          });
          setError(null);
        },
        (err: FirestoreError) => {
          console.error(`Error listening to watchlist for user ${userId}:`, err);
          setError(`Failed to load watchlist for one or more users. ${err.message}`);
          setAllWatchlistsData((prevMap: Map<string, UserWatchlistData>) => {
            const newMap = new Map(prevMap);
            newMap.delete(userId);
            return newMap;
          });
        }
      );
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [user?.uid, friends]);

  useEffect(() => {
    if (isLoadingFriends) {
        return;
    }

    setIsLoading(true);
    let combinedMovies: FirestoreWatchlistItem[] = [];
    let combinedTv: FirestoreWatchlistItem[] = [];

    allWatchlistsData.forEach((watchlist: UserWatchlistData) => {
      combinedMovies = combinedMovies.concat(watchlist.movie);
      combinedTv = combinedTv.concat(watchlist.tv);
    });

    try {
        const processedMovies = processWatchlistItems(combinedMovies, 'movie');
        const processedTv = processWatchlistItems(combinedTv, 'tv');

        setFriendsWatchlistItems({ movie: processedMovies, tv: processedTv });
        setError(null);
    } catch (processingError: unknown) {
        console.error("Error processing watchlist items:", processingError);
        let errorMessage = 'An unknown error occurred during processing.';
        if (processingError instanceof Error) {
            errorMessage = processingError.message;
        } else if (typeof processingError === 'string') {
            errorMessage = processingError;
        }
        setError(`Failed to process watchlist data. ${errorMessage}`);
        setFriendsWatchlistItems({ movie: [], tv: [] });
    } finally {
        setIsLoading(false);
    }

  }, [allWatchlistsData, isLoadingFriends]); 

  return (
    <FriendsWatchlistContext.Provider value={{
      friendsWatchlistItems,
      isLoading: isLoading || isLoadingFriends,
      error,
    }}>
      {children}
    </FriendsWatchlistContext.Provider>
  );
};
