'use client';

import React from 'react';
import { SWRConfig } from 'swr';
import swrConfig from '@/lib/swr-config';
import { UserDataProvider } from '@/context/UserDataContext';
import { FriendsWatchlistProvider } from '@/context/FriendsWatchlistContext';
import { SearchProvider } from '@/context/SearchContext';
import { SessionProvider } from '@/context/SessionContext';
import { Toaster } from '@/components/ui/toaster';

// This component wraps all client-side context providers
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {/* AuthProvider is already provided in the root layout (app/layout.tsx) */}
      {/* UserDataProvider might depend on the auth context, which is fine */}
      <UserDataProvider>
        <FriendsWatchlistProvider>
            <SearchProvider>
              <SessionProvider>
                {children}
                {/* Toaster is placed here so it has access to contexts if needed */}
                <Toaster />
              </SessionProvider>
            </SearchProvider>
          </FriendsWatchlistProvider>
        </UserDataProvider>
      </SWRConfig>
  );
}
