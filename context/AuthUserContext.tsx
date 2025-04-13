// context/AuthUserContext.tsx
'use client';

import React, { createContext, useContext, useMemo } from 'react'; // Import useMemo
import { UserData } from '@/types';
import { useUserProfileAndWatchlist } from '@/hooks/user/useUserProfileAndWatchlist'; // Renamed hook
import { KeyedMutator } from 'swr';

// Define the shape of the context data
interface AuthUserContextType {
  userData: UserData | null;
  isLoading: boolean; // Specific to user profile/watchlist loading
  mutateUserData: KeyedMutator<UserData | null>;
  error: Error | null; // Include error state from the hook
}

// Create the context
const AuthUserContext = createContext<AuthUserContextType | undefined>(undefined);

// Custom hook to consume the context
export const useAuthUser = () => {
  const context = useContext(AuthUserContext);
  if (context === undefined) {
    throw new Error('useAuthUser must be used within an AuthUserProvider');
  }
  return context;
};

// Provider component
interface AuthUserProviderProps {
  children: React.ReactNode;
  // Allow passing initial data if available (e.g., from server components)
  initialUserData?: Omit<UserData, 'watchlist'> | null;
}

export const AuthUserProvider: React.FC<AuthUserProviderProps> = ({ children, initialUserData }) => {
  // Use the renamed hook to get user profile and watchlist data
  const { userData, isLoading, mutateUserData, error } = useUserProfileAndWatchlist({ fallbackData: initialUserData });

  // Memoize the context value
  const value = useMemo<AuthUserContextType>(() => ({
    userData,
    isLoading,
    mutateUserData,
    error
  }), [userData, isLoading, mutateUserData, error]); // Add dependencies

  return (
    <AuthUserContext.Provider value={value}>
      {children}
    </AuthUserContext.Provider>
  );
};
