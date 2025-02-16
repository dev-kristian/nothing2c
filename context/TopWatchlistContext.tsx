'use client'

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TopWatchlistItem, TopWatchlistContextType, FirestoreWatchlistItem } from '@/types';
import { useUserData } from './UserDataContext';

const TopWatchlistContext = createContext<TopWatchlistContextType | undefined>(undefined);

export const useTopWatchlist = () => {
  const context = useContext(TopWatchlistContext);
  if (!context) {
    throw new Error('useTopWatchlist must be used within a TopWatchlistProvider');
  }
  return context;
};

export const TopWatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topWatchlistItems, setTopWatchlistItems] = useState<{ movie: TopWatchlistItem[]; tv: TopWatchlistItem[] }>({
    movie: [],
    tv: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userData, friends, isLoadingFriends, isLoadingRequests } = useUserData();

  const fetchTopWatchlistItemsForUser = useCallback(async (userId: string, mediaType: 'movie' | 'tv'): Promise<FirestoreWatchlistItem[]> => {
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
      return [];
    }
  }, []);

  const fetchTopWatchlistItems = useCallback(async (mediaType: 'movie' | 'tv') => {
    setIsLoading(true);
    setError(null);
  
    try {
      const watchlistCounts: { [id: number]: number } = {};
      let allUserItems: FirestoreWatchlistItem[] = [];

      if (userData?.uid) {
        const userItems = await fetchTopWatchlistItemsForUser(userData.uid, mediaType);
        allUserItems = [...allUserItems, ...userItems];
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

      setTopWatchlistItems(prev => ({ ...prev, [mediaType]: topItems }));

    } catch (error) {
      console.error('Error fetching aggregated topWatchlist items:', error);
      setError(`Failed to fetch topWatchlist items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.uid, friends, fetchTopWatchlistItemsForUser]);

  useEffect(() => {
    if (userData && !isLoadingFriends && !isLoadingRequests) {
      fetchTopWatchlistItems('movie');
      fetchTopWatchlistItems('tv');
    }
  }, [userData, isLoadingFriends, isLoadingRequests, fetchTopWatchlistItems]);

  return (
    <TopWatchlistContext.Provider value={{
      topWatchlistItems,
      setTopWatchlistItems,
      isLoading,
      error,
      fetchTopWatchlistItems,
    }}>
      {children}
    </TopWatchlistContext.Provider>
  );
};
