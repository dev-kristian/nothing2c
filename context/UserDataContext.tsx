//context\UserDataContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
// Removed: import { useWatchlist } from '@/hooks/user/useWatchlist';
import { useFriends } from '@/hooks/user/useFriends';
import { useNotification } from '@/hooks/user/useNotification';
import { UserDataContextType, UserData } from '@/types';
import { useUserData as useUserDataHook } from '@/hooks/user/useUserData';

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

import { KeyedMutator } from 'swr'; 

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, isLoading: isLoadingUserData, mutateUserData } = useUserDataHook() as { 
    userData: UserData | null;
    isLoading: boolean;
    mutateUserData: KeyedMutator<UserData | null>;
  };
  // Removed: const { watchlistItems, addToWatchlist, removeFromWatchlist, isLoading: isLoadingWatchlist } = useWatchlist();
  const { friends, friendRequests, isLoadingFriends, isLoadingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } =
    useFriends(userData?.username);
  const { updateNotificationStatus } = useNotification();

  const isLoading = isLoadingUserData || isLoadingFriends || isLoadingRequests; // Removed isLoadingWatchlist

  return (
    <UserDataContext.Provider
      value={{
        userData,
        isLoading: isLoading,
        // Removed: watchlistItems,
        // Removed: addToWatchlist,
        // Removed: removeFromWatchlist,
        mutateUserData,
        friends,
        friendRequests,
        isLoadingFriends,
        isLoadingRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        updateNotificationStatus 
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};
