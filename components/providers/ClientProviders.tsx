'use client';

import React from 'react';
import { SWRConfig } from 'swr';
import swrConfig from '@/lib/swr-config';
import { UserDataProvider } from '@/context/UserDataContext';
import { FriendsWatchlistProvider } from '@/context/FriendsWatchlistContext';
import { SearchProvider } from '@/context/SearchContext';
import { SessionProvider } from '@/context/SessionContext';
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <UserDataProvider>
        <FriendsWatchlistProvider>
            <SearchProvider>
              <SessionProvider>
                {children}
                <Toaster />
              </SessionProvider>
            </SearchProvider>
          </FriendsWatchlistProvider>
        </UserDataProvider>
      </SWRConfig>
  );
}
