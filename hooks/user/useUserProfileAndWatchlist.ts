'use client'

import { useState, useEffect, useMemo, useRef } from 'react'; // Import useRef
import { useAuthContext } from '@/context/AuthContext';
import { UserData, FirestoreWatchlistItem } from '@/types';
import useSWR, { KeyedMutator } from 'swr';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe, DocumentSnapshot, FirestoreError } from 'firebase/firestore';

type RealtimeWatchlist = {
  movie: FirestoreWatchlistItem[];
  tv: FirestoreWatchlistItem[];
};

const fetcher = async (url: string): Promise<Omit<UserData, 'watchlist'>> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch user data: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.createdAt) data.createdAt = new Date(data.createdAt);
  if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);
  return data as Omit<UserData, 'watchlist'>;
};

interface UseUserDataOptions {
  fallbackData?: Omit<UserData, 'watchlist'> | null;
}

export const useUserProfileAndWatchlist = (options?: UseUserDataOptions) => {
  const { user, loading: authLoading } = useAuthContext(); // Get auth loading state
  const userKey = user ? '/api/users/me' : null; // Key depends only on user presence

  const {
    data: profileData,
    error: swrError,
    isLoading: isProfileLoading,
    mutate: mutateProfile,
  } = useSWR<Omit<UserData, 'watchlist'> | null, Error>( 
    userKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnMount: !options?.fallbackData, // Revert: Only revalidate if no fallback
      fallbackData: options?.fallbackData === undefined ? undefined : options.fallbackData,
      // Removed onSuccess and onError related to initialProfileLoaded
    }
  );

  const [realtimeWatchlist, setRealtimeWatchlist] = useState<RealtimeWatchlist>({ movie: [], tv: [] });
  const [watchlistError, setWatchlistError] = useState<FirestoreError | null>(null);
  const [isWatchlistInitiallyLoaded, setIsWatchlistInitiallyLoaded] = useState(false); // Track initial watchlist load
  const hasWatchlistLoadedOnce = useRef(false); // Prevent setting true multiple times

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    // Reset initial load state when user changes
    hasWatchlistLoadedOnce.current = false;
    setIsWatchlistInitiallyLoaded(false);

    if (user?.uid) {
      setWatchlistError(null);
      const watchlistDocRef = doc(db, 'watchlists', user.uid);

      unsubscribe = onSnapshot(watchlistDocRef,
        (docSnapshot: DocumentSnapshot) => {
          const data = docSnapshot.data();
          setRealtimeWatchlist({
            movie: (data?.movie || []) as FirestoreWatchlistItem[],
            tv: (data?.tv || []) as FirestoreWatchlistItem[],
          });
          setWatchlistError(null);
          // Set initial load to true only once
          if (!hasWatchlistLoadedOnce.current) {
            setIsWatchlistInitiallyLoaded(true);
            hasWatchlistLoadedOnce.current = true;
          }
        },
        (error: FirestoreError) => {
          console.error("Error fetching user watchlist:", error);
          // Also mark as loaded on error to avoid infinite loading state
          if (!hasWatchlistLoadedOnce.current) {
            setIsWatchlistInitiallyLoaded(true);
            hasWatchlistLoadedOnce.current = true;
          }
          setWatchlistError(error);
          setRealtimeWatchlist({ movie: [], tv: [] });
          // Removed initialWatchlistLoaded update
        }
      );
    } else {
      // Reset watchlist and mark as loaded if no user
      setRealtimeWatchlist({ movie: [], tv: [] });
      setWatchlistError(null);
      setIsWatchlistInitiallyLoaded(true); // No user means watchlist is effectively "loaded" (as empty)
      hasWatchlistLoadedOnce.current = true;
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
       }
     };
   }, [user?.uid]);

  const combinedUserData: UserData | null = useMemo(() => {
    return profileData
      ? {
          ...(profileData as Omit<UserData, 'watchlist'>), 
          watchlist: realtimeWatchlist,
        } as UserData
      : null;
  }, [profileData, realtimeWatchlist]);

  // Calculate final loading state
  const finalIsLoading = authLoading || isProfileLoading || (!!user && !isWatchlistInitiallyLoaded);

  return useMemo(() => ({
    userData: combinedUserData,
    isLoading: finalIsLoading, // Use combined loading state
    error: swrError || watchlistError,
    mutateUserData: mutateProfile as KeyedMutator<UserData | null>
  }), [combinedUserData, finalIsLoading, swrError, watchlistError, mutateProfile]); // Removed authLoading dependency
};
