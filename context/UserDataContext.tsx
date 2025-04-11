//context\UserDataContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
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

interface UserDataProviderProps {
  children: React.ReactNode;
  initialUserData?: UserData | null;
}

export const UserDataProvider: React.FC<UserDataProviderProps> = ({ children, initialUserData }) => {
  const { userData, isLoading: isLoadingUserData, mutateUserData } = useUserDataHook({ fallbackData: initialUserData }) as {
    userData: UserData | null;
    isLoading: boolean;
    mutateUserData: KeyedMutator<UserData | null>;
  };
  const { friends, friendRequests, isLoadingFriends, isLoadingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } =
    useFriends();
  const { updateNotificationStatus } = useNotification();

  const isLoading = isLoadingUserData || isLoadingFriends || isLoadingRequests;

  return (
    <UserDataContext.Provider
      value={{
        userData,
        isLoading: isLoading,
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
