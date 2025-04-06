'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FriendsWatchlistItem, FirestoreWatchlistItem } from '@/types'; 
import { useUserData } from './UserDataContext';
import useSWR, { useSWRConfig } from 'swr';

interface FriendsWatchlistContextType {
  friendsWatchlistItems: { movie: FriendsWatchlistItem[]; tv: FriendsWatchlistItem[] };
  setFriendsWatchlistItems: (data: { movie: FriendsWatchlistItem[]; tv: FriendsWatchlistItem[] }) => void;
  isLoading: boolean;
  error: string | null;
  fetchFriendsWatchlistItems: (mediaType: 'movie' | 'tv') => void;
}

const FriendsWatchlistContext = createContext<FriendsWatchlistContextType | undefined>(undefined);

export const useFriendsWatchlist = () => {
  const context = useContext(FriendsWatchlistContext);
  if (!context) {
    throw new Error('useFriendsWatchlist must be used within a FriendsWatchlistProvider');
  }
  return context;
};

export const FriendsWatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, friends, isLoadingFriends, isLoadingRequests } = useUserData();
  const { mutate } = useSWRConfig();

  const friendsWatchlistKey = (userData && !isLoadingFriends && !isLoadingRequests)
    ? `/friendsWatchlist/${userData.uid}/${friends?.map(f => f.uid).join(',')}`
    : null;

  const { data: friendsWatchlistItems, error: swrError, isLoading } = useSWR<{ movie: FriendsWatchlistItem[]; tv: FriendsWatchlistItem[] }>(
    friendsWatchlistKey,
    async (key) => {
      if (!key) return { movie: [], tv: [] };

      const fetchFriendsWatchlistItemsForUser = async (userId: string, mediaType: 'movie' | 'tv'): Promise<FirestoreWatchlistItem[]> => {
        try {
          const docRef = doc(db, 'watchlists', userId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            return (data[mediaType] || []) as FirestoreWatchlistItem[];
          }
          return [];
        } catch (error) {
          console.error(`Error fetching friendsWatchlist items for user ${userId}:`, error);
          throw error; 
        }
      };

      const fetchFriendsWatchlistItems = async (mediaType: 'movie' | 'tv') => {
        const watchlistCounts: { [id: number]: number } = {};
        let allUserItems: FirestoreWatchlistItem[] = [];

        if (userData?.uid) {
          try {
            const userItems = await fetchFriendsWatchlistItemsForUser(userData.uid, mediaType);
            allUserItems = [...allUserItems, ...userItems];
          } catch (userError) {
            throw userError;
          }
        }
        if (friends && friends.length > 0) {
          const friendsItemsPromises = friends.map(friend =>
            fetchFriendsWatchlistItemsForUser(friend.uid, mediaType)
          );
          const friendsItemsResults = await Promise.all(friendsItemsPromises);
          friendsItemsResults.forEach(items => {
            allUserItems = [...allUserItems, ...items];
          });
        }

        const filteredAndCountedItems: FriendsWatchlistItem[] = [];
        allUserItems.forEach(item => {
          if (item.media_type === mediaType && typeof item.vote_average === 'number' && item.vote_average > 0) {
            watchlistCounts[item.id] = (watchlistCounts[item.id] || 0) + 1;

            if (!filteredAndCountedItems.find(existingItem => existingItem.id === item.id)) {
              filteredAndCountedItems.push({
                ...item,
                vote_average: item.vote_average,
                weighted_score: item.vote_average
              });
            }
          }
        });

        filteredAndCountedItems.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));

        const topItems: FriendsWatchlistItem[] = filteredAndCountedItems.slice(0, 20).map(item => ({
          ...item,
          watchlist_count: watchlistCounts[item.id],
        }));

        return topItems;
      };

      try {
        const movie = await fetchFriendsWatchlistItems('movie');
        const tv = await fetchFriendsWatchlistItems('tv');
        return { movie, tv };
      } catch (error) {
        throw error;
      }
    }, {
    revalidateIfStale: false,
  }
  );

  const error = swrError
    ? `Failed to fetch friendsWatchlist items: ${swrError instanceof Error ? swrError.message : 'Unknown error'}`
    : null;

  const setFriendsWatchlistItems = useCallback((data: { movie: FriendsWatchlistItem[]; tv: FriendsWatchlistItem[] }) => {
    mutate(friendsWatchlistKey, data, false); 
  }, [mutate, friendsWatchlistKey]);

  const fetchFriendsWatchlistItems = useCallback(() => {
    if (friendsWatchlistKey) {
      mutate(friendsWatchlistKey);
    }
  }, [mutate, friendsWatchlistKey]);

  return (
    <FriendsWatchlistContext.Provider value={{
      friendsWatchlistItems: friendsWatchlistItems || { movie: [], tv: [] }, 
      setFriendsWatchlistItems,
      isLoading,
      error,
      fetchFriendsWatchlistItems,
    }}>
      {children}
    </FriendsWatchlistContext.Provider>
  );
};
