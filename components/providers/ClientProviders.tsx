'use client';

import React from 'react';
// Removed incorrect SWRConfig imports
import { SWRProvider } from '@/context/SWRContext'; // Import the custom provider
import { UserDataProvider } from '@/context/UserDataContext';
import { FriendsWatchlistProvider } from '@/context/FriendsWatchlistContext';
import { SearchProvider } from '@/context/SearchContext';
import { SessionProvider } from '@/context/SessionContext';
// Removed Toaster import

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    // Use the custom SWRProvider which includes the onError handler
    <SWRProvider> 
      <UserDataProvider>
        <FriendsWatchlistProvider>
            <SearchProvider>
              <SessionProvider>
                {children}
                {/* Removed Toaster instance */}
              </SessionProvider>
            </SearchProvider>
          </FriendsWatchlistProvider>
        </UserDataProvider>
      </SWRProvider> 
  );
}
