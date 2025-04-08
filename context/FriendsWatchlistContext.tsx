'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { FriendsWatchlistItem } from '@/types';
import { useUserData } from './UserDataContext'; 
import useSWR, { useSWRConfig } from 'swr';

type FriendsWatchlistApiResponse = {
  movie: FriendsWatchlistItem[];
  tv: FriendsWatchlistItem[];
};

interface FriendsWatchlistContextType {
  friendsWatchlistItems: FriendsWatchlistApiResponse;
  isLoading: boolean;
  error: string | null;
  mutateFriendsWatchlist: () => void;
}

const FriendsWatchlistContext = createContext<FriendsWatchlistContextType | undefined>(undefined);

export const useFriendsWatchlist = () => {
  const context = useContext(FriendsWatchlistContext);
  if (!context) {
    throw new Error('useFriendsWatchlist must be used within a FriendsWatchlistProvider');
  }
  return context;
};

const fetcher = async (url: string): Promise<FriendsWatchlistApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed: ${res.statusText}`);
  }
  return res.json();
};

export const FriendsWatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData } = useUserData();
  const { mutate } = useSWRConfig();

  const friendsWatchlistKey = userData ? '/api/users/friends-watchlist' : null;

  const { data: friendsWatchlistItems, error: swrError, isLoading } = useSWR<FriendsWatchlistApiResponse>(
    friendsWatchlistKey,
    fetcher,
    {
      revalidateIfStale: true, 
      revalidateOnFocus: true,
    }
  );

  const error = swrError
    ? `Failed to fetch friends watchlist: ${swrError instanceof Error ? swrError.message : 'Unknown error'}`
    : null;

  const mutateFriendsWatchlist = useCallback(() => {
    if (friendsWatchlistKey) {
      mutate(friendsWatchlistKey);
    }
  }, [mutate, friendsWatchlistKey]);

  return (
    <FriendsWatchlistContext.Provider value={{
      friendsWatchlistItems: friendsWatchlistItems || { movie: [], tv: [] },
      isLoading,
      error,
      mutateFriendsWatchlist, 
    }}>
      {children}
    </FriendsWatchlistContext.Provider>
  );
};
