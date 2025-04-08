'use client';

import { useAuthContext } from '@/context/AuthContext';
import { UserData } from '@/types';
import useSWR from 'swr';

const fetcher = async (url: string): Promise<UserData> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch user data: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.createdAt) data.createdAt = new Date(data.createdAt);
  if (data.updatedAt) data.updatedAt = new Date(data.updatedAt);
  return data as UserData;
};

export const useUserData = () => {
  const { user } = useAuthContext();
  const userKey = user ? '/api/users/me' : null; 

  const { data: userData, error, isLoading, mutate } = useSWR<UserData, Error>(
    userKey,
    fetcher,
    {
      revalidateOnFocus: false, 
    }
  );

  return {
    userData: userData || null, 
    isLoading,
    error,
    mutateUserData: mutate 
  };
};
