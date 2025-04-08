'use client';

import { useAuthContext } from '@/context/AuthContext';
import { UserData } from '@/types';
import useSWR from 'swr';

// Define a fetcher function for SWR
const fetcher = async (url: string): Promise<UserData> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch user data: ${response.statusText}`);
  }
  const data = await response.json();
  // Potentially convert date strings back to Date objects if needed by the rest of the app
  // For now, assuming the UserData type or consumers handle string dates from JSON
  if (data.createdAt) data.createdAt = new Date(data.createdAt);
  if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);
  return data as UserData;
};

export const useUserData = () => {
  const { user } = useAuthContext();
  const userKey = user ? '/api/users/me' : null; // Only fetch if user is authenticated

  const { data: userData, error, isLoading, mutate } = useSWR<UserData, Error>(
    userKey,
    fetcher,
    {
      // Optional SWR configuration (e.g., revalidation settings)
      // revalidateOnFocus: false, // Example: disable revalidation on window focus
    }
  );

  // The updateNotificationStatus function is removed as it's handled by useNotification hook

  return {
    userData: userData || null, // Return null if data is not yet loaded or user is logged out
    isLoading,
    error,
    mutateUserData: mutate // Expose mutate function if needed for manual cache updates
  };
};
