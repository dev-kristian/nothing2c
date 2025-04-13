// context/FriendsContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { useFriends } from '@/hooks/user/useFriends';
import { Friend, FriendRequest } from '@/types';

// Define the shape of the context data based on useFriends hook return type
interface FriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  sendFriendRequest: (targetUser: { uid: string; username: string }) => Promise<void>;
  acceptFriendRequest: (request: FriendRequest) => Promise<void>;
  rejectFriendRequest: (request: FriendRequest) => Promise<void>;
  removeFriend: (friend: Friend) => Promise<void>;
}

// Create the context
const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

// Custom hook to consume the context
export const useFriendsContext = () => {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriendsContext must be used within a FriendsProvider');
  }
  return context;
};

// Provider component
interface FriendsProviderProps {
  children: React.ReactNode;
}

export const FriendsProvider: React.FC<FriendsProviderProps> = ({ children }) => {
  // Use the existing useFriends hook
  const friendsData = useFriends();

  // Provide all values from the useFriends hook
  return (
    <FriendsContext.Provider value={friendsData}>
      {children}
    </FriendsContext.Provider>
  );
};
