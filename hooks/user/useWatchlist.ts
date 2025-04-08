// hooks/user/useWatchlist.ts
import { useCallback, useMemo } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { Media } from '@/types';
import useSWR, { useSWRConfig } from 'swr';
import { Timestamp } from 'firebase/firestore'; // Import client-side Timestamp if needed for type checking

// Type for the data structure returned by the API (using maps)
interface WatchlistApiData {
  movie: { [id: string]: Media & { addedAt?: Timestamp | string } }; // API might return string dates
  tv: { [id: string]: Media & { addedAt?: Timestamp | string } };
}

// Type for the data structure exposed by the hook (using arrays)
interface WatchlistHookData {
  movie: Media[];
  tv: Media[];
}

interface UseWatchlistReturn {
  watchlistItems: WatchlistHookData;
  addToWatchlist: (item: Media, mediaType: 'movie' | 'tv') => Promise<void>;
  removeFromWatchlist: (id: number, mediaType: 'movie' | 'tv') => Promise<void>;
  isLoading: boolean;
  error: Error | undefined;
  mutateWatchlist: () => void; // Expose mutate for manual refresh
}

// SWR fetcher for the watchlist API
const fetcher = async (url: string): Promise<WatchlistApiData> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch watchlist: ${response.statusText}`);
  }
  return response.json();
};

export const useWatchlist = (): UseWatchlistReturn => {
  const { user } = useAuthContext();
  const { mutate } = useSWRConfig();
  const watchlistKey = user ? '/api/users/watchlist' : null; // Use API endpoint as key

  const { data: watchlistApiData, error, isLoading } = useSWR<WatchlistApiData, Error>(
    watchlistKey,
    fetcher
    // Optional SWR config
  );

  // Convert the map data from API to arrays for easier consumption
  const watchlistItems = useMemo((): WatchlistHookData => {
    if (!watchlistApiData) return { movie: [], tv: [] };
    return {
      movie: Object.values(watchlistApiData.movie || {}),
      tv: Object.values(watchlistApiData.tv || {}),
    };
  }, [watchlistApiData]);

  const addToWatchlist = useCallback(
    async (item: Media, mediaType: 'movie' | 'tv') => {
      if (!user || !watchlistKey) return;

      const optimisticData: WatchlistApiData = {
        ...(watchlistApiData || { movie: {}, tv: {} }), // Start with current data or empty
        [mediaType]: {
          ...(watchlistApiData?.[mediaType] || {}),
          [item.id.toString()]: { ...item, addedAt: new Date().toISOString() }, // Add optimistically with string date
        },
      };

      try {
        // Optimistic update
        await mutate(watchlistKey, optimisticData, false); // false = don't revalidate yet

        // API call
        const response = await fetch(watchlistKey, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item, mediaType }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to add item: ${response.statusText}`);
        }

        // Revalidate after successful API call
        mutate(watchlistKey);

      } catch (err) {
        console.error(`Error adding ${mediaType} to watchlist:`, err);
        // Rollback optimistic update on error
        mutate(watchlistKey, watchlistApiData, false); // Revert to original data
        // Optionally show a toast notification to the user
      }
    },
    [user, mutate, watchlistKey, watchlistApiData]
  );

  const removeFromWatchlist = useCallback(
    async (id: number, mediaType: 'movie' | 'tv') => {
      if (!user || !watchlistKey || !watchlistApiData?.[mediaType]?.[id.toString()]) return; // Check if item exists

      const optimisticData: WatchlistApiData = { ...watchlistApiData };
      delete optimisticData[mediaType][id.toString()]; // Remove optimistically

      try {
        // Optimistic update
        await mutate(watchlistKey, optimisticData, false);

        // API call
        const response = await fetch(`${watchlistKey}?id=${id}&mediaType=${mediaType}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to remove item: ${response.statusText}`);
        }

        // Revalidate after successful API call
        mutate(watchlistKey);

      } catch (err) {
        console.error(`Error removing ${mediaType} from watchlist:`, err);
        // Rollback optimistic update
        mutate(watchlistKey, watchlistApiData, false);
      }
    },
    [user, mutate, watchlistKey, watchlistApiData]
  );

  return {
    watchlistItems, // Return the array-based structure
    addToWatchlist,
    removeFromWatchlist,
    isLoading,
    error,
    mutateWatchlist: () => mutate(watchlistKey), // Expose mutate
  };
};
