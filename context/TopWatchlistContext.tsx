// context/TopWatchlistContext.tsx
'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TopWatchlistItem, FirestoreWatchlistItem } from '@/types'; 
import { useUserData } from './UserDataContext';
import useSWR, { useSWRConfig } from 'swr';

interface TopWatchlistContextType {
  topWatchlistItems: { movie: TopWatchlistItem[]; tv: TopWatchlistItem[] };
  setTopWatchlistItems: (data: { movie: TopWatchlistItem[]; tv: TopWatchlistItem[] }) => void;
  isLoading: boolean;
  error: string | null;
  fetchTopWatchlistItems: (mediaType: 'movie' | 'tv') => void;
}

const TopWatchlistContext = createContext<TopWatchlistContextType | undefined>(undefined);

export const useTopWatchlist = () => {
  const context = useContext(TopWatchlistContext);
  if (!context) {
    throw new Error('useTopWatchlist must be used within a TopWatchlistProvider');
  }
  return context;
};

export const TopWatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, friends, isLoadingFriends, isLoadingRequests } = useUserData();
  const { mutate } = useSWRConfig();

  const topWatchlistKey = (userData && !isLoadingFriends && !isLoadingRequests)
    ? `/topWatchlist/${userData.uid}/${friends?.map(f => f.uid).join(',')}`
    : null;

  const { data: topWatchlistItems, error: swrError, isLoading } = useSWR<{ movie: TopWatchlistItem[]; tv: TopWatchlistItem[] }>(
    topWatchlistKey,
    async (key) => {
      if (!key) return { movie: [], tv: [] };

      const fetchTopWatchlistItemsForUser = async (userId: string, mediaType: 'movie' | 'tv'): Promise<FirestoreWatchlistItem[]> => {
        try {
          const docRef = doc(db, 'watchlists', userId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            return (data[mediaType] || []) as FirestoreWatchlistItem[];
          }
          return [];
        } catch (error) {
          console.error(`Error fetching topWatchlist items for user ${userId}:`, error);
          throw error; 
        }
      };

      const fetchTopWatchlistItems = async (mediaType: 'movie' | 'tv') => {
        const watchlistCounts: { [id: number]: number } = {};
        let allUserItems: FirestoreWatchlistItem[] = [];

        if (userData?.uid) {
          try {
            const userItems = await fetchTopWatchlistItemsForUser(userData.uid, mediaType);
            allUserItems = [...allUserItems, ...userItems];
          } catch (userError) {
            throw userError;
          }
        }
        if (friends && friends.length > 0) {
          const friendsItemsPromises = friends.map(friend =>
            fetchTopWatchlistItemsForUser(friend.uid, mediaType)
          );
          const friendsItemsResults = await Promise.all(friendsItemsPromises);
          friendsItemsResults.forEach(items => {
            allUserItems = [...allUserItems, ...items];
          });
        }

        const filteredAndCountedItems: TopWatchlistItem[] = [];
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

        const topItems: TopWatchlistItem[] = filteredAndCountedItems.slice(0, 20).map(item => ({
          ...item,
          watchlist_count: watchlistCounts[item.id],
        }));

        return topItems;
      };

      try {
        const movie = await fetchTopWatchlistItems('movie');
        const tv = await fetchTopWatchlistItems('tv');
        return { movie, tv };
      } catch (error) {
        throw error;
      }
    }, {
    revalidateIfStale: false,
  }
  );

  const error = swrError
    ? `Failed to fetch topWatchlist items: ${swrError instanceof Error ? swrError.message : 'Unknown error'}`
    : null;


  const setTopWatchlistItems = useCallback((data: { movie: TopWatchlistItem[]; tv: TopWatchlistItem[] }) => {
    mutate(topWatchlistKey, data, false); 
  }, [mutate, topWatchlistKey]);

  const fetchTopWatchlistItems = useCallback((mediaType: 'movie' | 'tv') => {
    if (topWatchlistKey) {
      mutate(topWatchlistKey);
    }

  }, [mutate, topWatchlistKey]);

  return (
    <TopWatchlistContext.Provider value={{
      topWatchlistItems: topWatchlistItems || { movie: [], tv: [] }, 
      setTopWatchlistItems,
      isLoading,
      error,
      fetchTopWatchlistItems,
    }}>
      {children}
    </TopWatchlistContext.Provider>
  );
};