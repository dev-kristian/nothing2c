import { Media, UserData } from '@/types';
import { KeyedMutator } from 'swr';

// Helper function for deep cloning (simple version for this structure)
const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Adds an item to the user's watchlist.
 * Handles optimistic updates and revalidation using SWR's mutate function.
 *
 * @param item The Media item to add.
 * @param mediaType 'movie' or 'tv'.
 * @param currentUserData The current UserData object (needed for optimistic update).
 * @param mutateUserData The SWR mutate function for the user data key ('/api/users/me').
 */
export const addUserWatchlistItem = async (
  item: Media,
  mediaType: 'movie' | 'tv',
  currentUserData: UserData | null,
  mutateUserData: KeyedMutator<UserData | null>
): Promise<void> => {
  if (!currentUserData) {
    console.error('Cannot add to watchlist: User data not available.');
    // Optionally throw an error or show a user message
    return;
  }

  const watchlistKey = '/api/users/watchlist'; // API endpoint for mutations

  // --- Optimistic Update ---
  const optimisticUserData = deepClone(currentUserData);
  // Ensure the watchlist arrays exist
  optimisticUserData.watchlist = optimisticUserData.watchlist ?? { movie: [], tv: [] };
  optimisticUserData.watchlist[mediaType] = optimisticUserData.watchlist[mediaType] ?? [];

  // Check if item already exists optimistically
  const exists = optimisticUserData.watchlist[mediaType].some(existingItem => existingItem.id === item.id);

  if (!exists) {
    // Add the item optimistically (create a basic representation)
    const optimisticItem: Media = {
        ...item, // Spread the provided item details
        addedAt: new Date().toISOString(), // Add a temporary timestamp
    };
    optimisticUserData.watchlist[mediaType].push(optimisticItem);

    // Apply optimistic update without revalidation
    mutateUserData(optimisticUserData, false);
  }
  // --- End Optimistic Update ---

  try {
    // API call to persist the change
    const response = await fetch(watchlistKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item, mediaType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to add item: ${response.statusText}`);
    }

    // Revalidate user data after successful API call to get the final state
    mutateUserData();

  } catch (err) {
    console.error(`Error adding ${mediaType} to watchlist:`, err);
    // Rollback optimistic update on error by revalidating
    mutateUserData();
    // Optionally show a toast notification to the user
    // Re-throw the error if the calling component needs to handle it
    throw err;
  }
};

/**
 * Removes an item from the user's watchlist.
 * Handles optimistic updates and revalidation using SWR's mutate function.
 *
 * @param id The ID of the Media item to remove.
 * @param mediaType 'movie' or 'tv'.
 * @param currentUserData The current UserData object (needed for optimistic update).
 * @param mutateUserData The SWR mutate function for the user data key ('/api/users/me').
 */
export const removeUserWatchlistItem = async (
  id: number,
  mediaType: 'movie' | 'tv',
  currentUserData: UserData | null,
  mutateUserData: KeyedMutator<UserData | null>
): Promise<void> => {
  if (!currentUserData) {
    console.error('Cannot remove from watchlist: User data not available.');
    // Optionally throw an error or show a user message
    return;
  }

  const watchlistKey = `/api/users/watchlist?id=${id}&mediaType=${mediaType}`; // API endpoint for mutations

  // --- Optimistic Update ---
  const optimisticUserData = deepClone(currentUserData);
  let itemExisted = false;

  if (optimisticUserData.watchlist && optimisticUserData.watchlist[mediaType]) {
    const initialLength = optimisticUserData.watchlist[mediaType].length;
    optimisticUserData.watchlist[mediaType] = optimisticUserData.watchlist[mediaType].filter(
      existingItem => existingItem.id !== id
    );
    itemExisted = optimisticUserData.watchlist[mediaType].length < initialLength;
  }

  // Apply optimistic update only if the item was found and removed
  if (itemExisted) {
    mutateUserData(optimisticUserData, false);
  }
  // --- End Optimistic Update ---

  try {
    // API call to persist the change
    const response = await fetch(watchlistKey, {
      method: 'DELETE',
    });

    if (!response.ok) {
      // Handle 404 (Not Found) gracefully if the API indicates the item wasn't there anyway
      if (response.status === 404) {
        console.warn(`Item ${id} (${mediaType}) not found on server, but continuing.`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to remove item: ${response.statusText}`);
      }
    }

    // Revalidate user data after successful API call (or acceptable error like 404)
    mutateUserData();

  } catch (err) {
    console.error(`Error removing ${mediaType} from watchlist:`, err);
    // Rollback optimistic update on error by revalidating
    mutateUserData();
    // Optionally show a toast notification to the user
    // Re-throw the error if the calling component needs to handle it
    throw err;
  }
};
