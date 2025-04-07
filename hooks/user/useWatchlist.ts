// hooks/user/useWatchlist.ts
import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, DocumentData, getDoc } from 'firebase/firestore';
import { Media } from '@/types';
import useSWR, { useSWRConfig } from 'swr';

interface Watchlist {
  movie: Media[];
  tv: Media[];
}

interface UseWatchlistReturn {
  watchlistItems: Watchlist;
  addToWatchlist: (item: Media, mediaType: 'movie' | 'tv') => Promise<void>;
  removeFromWatchlist: (id: number, mediaType: 'movie' | 'tv') => Promise<void>;
  isLoading: boolean;
  error: Error | undefined; // More specific error type
}

export const useWatchlist = (): UseWatchlistReturn => {
  const { user } = useAuthContext();
  const { mutate } = useSWRConfig();
  const watchlistKey = user ? `watchlists/${user.uid}` : null;

  const { data: watchlistItems, error, isLoading } = useSWR<Watchlist, Error, string | null>(
    watchlistKey,
    async (key) => {
      if (!key) return { movie: [], tv: [] };
      const watchlistDocRef = doc(db, key); // Corrected: Consistent naming.
      const docSnap = await getDoc(watchlistDocRef); // Corrected: Use getDoc()
      if (docSnap.exists()) {
        const data = docSnap.data() as DocumentData;
        return {
          movie: (data?.movie || []) as Media[],
          tv: (data?.tv || []) as Media[],
        };
      } else {
        return { movie: [], tv: [] };
      }
    }
    // Removed { revalidateIfStale: false } to allow default SWR revalidation
  );

  const addToWatchlist = useCallback(
    async (item: Media, mediaType: 'movie' | 'tv') => {
      if (!user) return;

      const watchlistDocRef = doc(db, 'watchlists', user.uid);
      try {
        const itemToAdd = {
          ...item,
          addedAt: new Date().toISOString()
        };

        await mutate(
          watchlistKey,
          async (cachedData: Watchlist | undefined) => {
            const updatedWatchlist = cachedData
              ? { ...cachedData }
              : { movie: [], tv: [] };
            updatedWatchlist[mediaType] = [
              ...(updatedWatchlist[mediaType] || []),
              itemToAdd,
            ];
            await setDoc(
              watchlistDocRef,
              { [mediaType]: arrayUnion(itemToAdd) },
              { merge: true }
            );
            return updatedWatchlist;
          },
          {
            revalidate: false,
          }
        );
      } catch (error) {
        console.error(`Error adding ${mediaType} to watchlist:`, error);
        mutate(watchlistKey);
      }
    },
    [user, mutate, watchlistKey]
  );

  const removeFromWatchlist = useCallback(
    async (id: number, mediaType: 'movie' | 'tv') => {
      if (!user) return;

      const watchlistDocRef = doc(db, 'watchlists', user.uid); // Corrected: Redefine docRef.
      try {
        await mutate(
          watchlistKey,
          async (cachedData: Watchlist | undefined) => {
            if (!cachedData) return { movie: [], tv: [] };

            const updatedWatchlist = { ...cachedData };
            updatedWatchlist[mediaType] = updatedWatchlist[mediaType].filter(
              (item) => item.id !== id
            );

            const docSnap = await getDoc(watchlistDocRef); // Corrected: Use getDoc().
            if (docSnap.exists()) {
              const currentData = docSnap.data() as Watchlist;
              const itemToRemove = currentData[mediaType].find(
                (item) => item.id === id
              );

              if (itemToRemove) {
                await updateDoc(watchlistDocRef, {
                  [mediaType]: arrayRemove(itemToRemove),
                });
              }
            }
            return updatedWatchlist;
          },
          {
            revalidate: false,
          }
        );
      } catch (error) {
        console.error(`Error removing ${mediaType} from watchlist:`, error);
        mutate(watchlistKey);
      }
    },
    [user, mutate, watchlistKey]
  );

  return {
    watchlistItems: watchlistItems || { movie: [], tv: [] },
    addToWatchlist,
    removeFromWatchlist,
    isLoading,
    error,
  };
};
