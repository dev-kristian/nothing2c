'use client';

import React from 'react';
import { SWRProvider } from '@/context/SWRContext';
import { UserDataProvider } from '@/context/UserDataContext';
import { FriendsWatchlistProvider } from '@/context/FriendsWatchlistContext';
import { SearchProvider } from '@/context/SearchContext';
import { SessionProvider } from '@/context/SessionContext';
import { UserData } from '@/types/user';

interface ClientProvidersProps {
  children: React.ReactNode;
  initialUserData: UserData | null;
}

export function ClientProviders({ children, initialUserData }: ClientProvidersProps) {
  return (
    <SWRProvider>
      <UserDataProvider initialUserData={initialUserData}>
        <FriendsWatchlistProvider>
            <SearchProvider>
              <SessionProvider>
                {children}
              </SessionProvider>
            </SearchProvider>
          </FriendsWatchlistProvider>
        </UserDataProvider>
      </SWRProvider> 
  );
}
