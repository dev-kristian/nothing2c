//context\UserDataContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { useWatchlist } from '@/hooks/user/useWatchlist';
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
  const { userData, isLoading: isLoadingUserData, mutateUserData } = useUserDataHook() as { // Removed error: userDataError
    userData: UserData | null;
    isLoading: boolean;
    // error: Error | undefined; // Removed error type definition
    mutateUserData: KeyedMutator<UserData | null>;
  };
  const { watchlistItems, addToWatchlist, removeFromWatchlist, isLoading: isLoadingWatchlist } = useWatchlist(); // Removed error: watchlistError
  const { friends, friendRequests, isLoadingFriends, isLoadingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } =
    useFriends(userData?.username);
  const { updateNotificationStatus } = useNotification(); 

  const isLoading = isLoadingUserData || isLoadingWatchlist || isLoadingFriends || isLoadingRequests;

  return (
    <UserDataContext.Provider
      value={{
        userData,
        isLoading: isLoading,
        watchlistItems,
        addToWatchlist,
        removeFromWatchlist,
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
