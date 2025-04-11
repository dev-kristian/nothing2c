import { Media } from '@/types'; // Removed UserData import
// Removed KeyedMutator import
// Removed deepClone function as it's no longer needed

/**
 * Adds an item to the user's watchlist.
 * Handles optimistic updates and revalidation using SWR's mutate function.
 *
 * @param item The Media item to add.
 * @param mediaType 'movie' or 'tv'.
 */
export const addUserWatchlistItem = async (
  item: Media,
  mediaType: 'movie' | 'tv'
): Promise<void> => {
  // Removed currentUserData check and optimistic update logic

  const watchlistKey = '/api/users/watchlist'; // API endpoint for mutations

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

    // No revalidation needed, listener will update UI

  } catch (err) {
    console.error(`Error adding ${mediaType} to watchlist:`, err);
    // No rollback needed as optimistic update was removed
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
 */
export const removeUserWatchlistItem = async (
  id: number,
  mediaType: 'movie' | 'tv'
): Promise<void> => {
  // Removed currentUserData check and optimistic update logic

  const watchlistKey = `/api/users/watchlist?id=${id}&mediaType=${mediaType}`; // API endpoint for mutations

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

    // No revalidation needed, listener will update UI

  } catch (err) {
    console.error(`Error removing ${mediaType} from watchlist:`, err);
    // No rollback needed as optimistic update was removed
    // Optionally show a toast notification to the user
    // Re-throw the error if the calling component needs to handle it
    throw err;
  }
};
