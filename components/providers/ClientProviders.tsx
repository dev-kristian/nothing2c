'use client';

import React from 'react';
import { SWRProvider } from '@/context/SWRContext';
import { AuthUserProvider } from '@/context/AuthUserContext'; // New
import { FriendsProvider } from '@/context/FriendsContext'; // New
import { NotificationsProvider } from '@/context/NotificationsContext'; // New
import { FriendsWatchlistProvider } from '@/context/FriendsWatchlistContext';
import { SearchProvider } from '@/context/SearchContext';
import { SessionProvider } from '@/context/SessionContext';
import { UserData } from '@/types/user';

interface ClientProvidersProps {
  children: React.ReactNode;
  initialUserData: Omit<UserData, 'watchlist'> | null;
}

export function ClientProviders({ children, initialUserData }: ClientProvidersProps) {
  return (
    <SWRProvider>
      <AuthUserProvider initialUserData={initialUserData}>
        <FriendsProvider>
          <NotificationsProvider>
            <FriendsWatchlistProvider>
              <SearchProvider>
                <SessionProvider>
                {children}
                </SessionProvider>
              </SearchProvider>
            </FriendsWatchlistProvider>
          </NotificationsProvider>
        </FriendsProvider>
      </AuthUserProvider>
    </SWRProvider>
  );
}
