//context\UserDataContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { useWatchlist } from '@/hooks/user/useWatchlist';
import { useFriends } from '@/hooks/user/useFriends';
import { UserDataContextType } from '@/types';
import { useUserData as useUserDataHook } from '@/hooks/user/useUserData';

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, updateNotificationStatus } = useUserDataHook();
  const { watchlistItems, addToWatchlist, removeFromWatchlist } = useWatchlist(); // Get watchlistItems
  const { friends, friendRequests, isLoadingFriends, isLoadingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } =
    useFriends(userData?.username);

  return (
    <UserDataContext.Provider
      value={{
        userData,
        isLoading: false, 
        watchlistItems, 
        addToWatchlist,
        removeFromWatchlist,
        updateNotificationStatus,
        friends,
        friendRequests,
        isLoadingFriends,
        isLoadingRequests,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};