'use client'

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { UserData, FirestoreWatchlistItem } from '@/types'; // Assuming FirestoreWatchlistItem is in types
import useSWR, { KeyedMutator } from 'swr';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe, DocumentSnapshot, FirestoreError } from 'firebase/firestore';

// Type for the real-time watchlist data
type RealtimeWatchlist = {
  movie: FirestoreWatchlistItem[];
  tv: FirestoreWatchlistItem[];
};

// Fetcher for the main user profile data (excluding the watchlist object)
const fetcher = async (url: string): Promise<Omit<UserData, 'watchlist'>> => { // Omit the 'watchlist' property
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch user data: ${response.statusText}`);
  }
  const data = await response.json();
  // Keep date conversions if needed for profile data
  if (data.createdAt) data.createdAt = new Date(data.createdAt);
  if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);
  // We expect the API might still return watchlist, but we'll overwrite it
  return data as Omit<UserData, 'watchlist'>; // Omit the 'watchlist' property
};

interface UseUserDataOptions {
  fallbackData?: UserData | null; // Fallback might include watchlist, will be overwritten by listener
}

export const useUserData = (options?: UseUserDataOptions) => {
  const { user, isSessionVerified } = useAuthContext(); // Get user and isSessionVerified
  // SWR key now depends on both user existence and session verification
  const userKey = user && isSessionVerified ? '/api/users/me' : null;

  // --- SWR for Core Profile Data ---
  const {
    data: profileData, // Renamed from userData to avoid confusion
    error: swrError,
    isLoading: isProfileLoading,
    mutate: mutateProfile, // Renamed from mutate
  } = useSWR<Omit<UserData, 'watchlist'> | null, Error>( // Omit the 'watchlist' property
    userKey,
    fetcher,
    {
      revalidateOnFocus: false,
      // Pass fallback data but understand watchlist part might be overwritten
      fallbackData: options?.fallbackData === undefined ? undefined : options.fallbackData,
    }
  );

  // --- State for Real-time Watchlist ---
  const [realtimeWatchlist, setRealtimeWatchlist] = useState<RealtimeWatchlist>({ movie: [], tv: [] });
  const [isWatchlistLoading, setIsWatchlistLoading] = useState<boolean>(true);
  const [watchlistError, setWatchlistError] = useState<FirestoreError | null>(null);

  // --- Effect for Watchlist Listener ---
  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    if (user?.uid) {
      setIsWatchlistLoading(true);
      setWatchlistError(null);
      const watchlistDocRef = doc(db, 'watchlists', user.uid);

      unsubscribe = onSnapshot(watchlistDocRef,
        (docSnapshot: DocumentSnapshot) => {
          const data = docSnapshot.data();
          setRealtimeWatchlist({
            movie: (data?.movie || []) as FirestoreWatchlistItem[],
            tv: (data?.tv || []) as FirestoreWatchlistItem[],
          });
          setIsWatchlistLoading(false);
          setWatchlistError(null);
        },
        (error: FirestoreError) => {
          console.error("Error fetching user watchlist:", error);
          setWatchlistError(error);
          setIsWatchlistLoading(false);
          setRealtimeWatchlist({ movie: [], tv: [] }); // Clear watchlist on error
        }
      );
    } else {
      // No user, clear watchlist and reset states
      setRealtimeWatchlist({ movie: [], tv: [] });
      setIsWatchlistLoading(false);
      setWatchlistError(null);
    }

    // Cleanup listener on unmount or user change
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]); // Dependency array ensures effect runs when user ID changes

  // --- Combine Profile and Watchlist Data ---
  const combinedUserData: UserData | null = profileData
    ? {
        ...(profileData as Omit<UserData, 'watchlist'>), // Spread the profile data
        // Assign the real-time watchlist object to the 'watchlist' property
        watchlist: realtimeWatchlist,
      } as UserData // Assert the final combined type is UserData
    : null;

  // --- Return Combined State ---
  return {
    userData: combinedUserData,
    isLoading: isProfileLoading || isWatchlistLoading, // Loading if either profile or watchlist is loading
    error: swrError || watchlistError, // Return first error encountered
    mutateUserData: mutateProfile as KeyedMutator<UserData | null> // Provide mutate function for profile data
  };
};
