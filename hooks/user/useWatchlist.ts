// hooks/user/useWatchlist.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { Media } from '@/types';

interface Watchlist {
  movie: Media[];
  tv: Media[];
}

interface UseWatchlistReturn {
  watchlistItems: Watchlist;
  addToWatchlist: (item: Media, mediaType: 'movie' | 'tv') => Promise<void>;
  removeFromWatchlist: (id: number, mediaType: 'movie' | 'tv') => Promise<void>;
}

export const useWatchlist = (): UseWatchlistReturn => {
  const { user } = useAuthContext();
  const [watchlistItems, setWatchlistItems] = useState<Watchlist>({ movie: [], tv: [] });

  useEffect(() => {
    if (!user) return;

    const watchlistDocRef = doc(db, 'watchlists', user.uid);
    
    // Set up a single listener for real-time updates
    const unsubscribe = onSnapshot(
      watchlistDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWatchlistItems({
            movie: (data?.movie || []) as Media[],
            tv: (data?.tv || []) as Media[]
          });
        } else {
          setWatchlistItems({ movie: [], tv: [] });
        }
      },
      (error) => {
        console.error('Error listening to watchlist:', error);
      }
    );

    // Cleanup listener on unmount or when user changes
    return () => unsubscribe();
  }, [user]);

  const addToWatchlist = useCallback(
    async (item: Media, mediaType: 'movie' | 'tv') => {
      if (!user) return;

      const watchlistDocRef = doc(db, 'watchlists', user.uid);
      try {
        await setDoc(
          watchlistDocRef,
          {
            [mediaType]: arrayUnion(item),
          },
          { merge: true }
        );
      } catch (error) {
        console.error(`Error adding ${mediaType} to watchlist:`, error);
      }
    },
    [user]
  );

  const removeFromWatchlist = useCallback(
    async (id: number, mediaType: 'movie' | 'tv') => {
      if (!user) return;

      const watchlistDocRef = doc(db, 'watchlists', user.uid);
      try {
        const docSnap = await getDoc(watchlistDocRef);
        if (docSnap.exists()) {
          const currentData = docSnap.data() as Watchlist;
          const itemToRemove = currentData[mediaType].find(item => item.id === id);

          if (itemToRemove) {
            await updateDoc(watchlistDocRef, {
              [mediaType]: arrayRemove(itemToRemove),
            });
          }
        }
      } catch (error) {
        console.error(`Error removing ${mediaType} from watchlist:`, error);
      }
    },
    [user]
  );

  return { watchlistItems, addToWatchlist, removeFromWatchlist };
};
