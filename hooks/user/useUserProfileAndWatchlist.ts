'use client'

import { useState, useEffect, useMemo, useRef } from 'react'; 
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
  const { user, loading: authLoading } = useAuthContext(); 
  const userKey = user ? '/api/users/me' : null; 

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
      revalidateOnMount: !options?.fallbackData, 
      fallbackData: options?.fallbackData === undefined ? undefined : options.fallbackData,
      
    }
  );

  const [realtimeWatchlist, setRealtimeWatchlist] = useState<RealtimeWatchlist>({ movie: [], tv: [] });
  const [watchlistError, setWatchlistError] = useState<FirestoreError | null>(null);
  const [isWatchlistInitiallyLoaded, setIsWatchlistInitiallyLoaded] = useState(false); 
  const hasWatchlistLoadedOnce = useRef(false); 

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    
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
          
          if (!hasWatchlistLoadedOnce.current) {
            setIsWatchlistInitiallyLoaded(true);
            hasWatchlistLoadedOnce.current = true;
          }
        },
        (error: FirestoreError) => {
          console.error("Error fetching user watchlist:", error);
          
          if (!hasWatchlistLoadedOnce.current) {
            setIsWatchlistInitiallyLoaded(true);
            hasWatchlistLoadedOnce.current = true;
          }
          setWatchlistError(error);
          setRealtimeWatchlist({ movie: [], tv: [] });
          
        }
      );
    } else {
      
      setRealtimeWatchlist({ movie: [], tv: [] });
      setWatchlistError(null);
      setIsWatchlistInitiallyLoaded(true); 
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

  
  const finalIsLoading = authLoading || isProfileLoading || (!!user && !isWatchlistInitiallyLoaded);

  return useMemo(() => ({
    userData: combinedUserData,
    isLoading: finalIsLoading, 
    error: swrError || watchlistError,
    mutateUserData: mutateProfile as KeyedMutator<UserData | null>
  }), [combinedUserData, finalIsLoading, swrError, watchlistError, mutateProfile]); 
};
