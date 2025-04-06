// app/(root)/layout.tsx
'use client'

import React, { Suspense } from 'react'
import Navigation from '@/components/Navigation'
import { WithAuth } from '@/components/auth/WithAuth'
import { UserDataProvider } from '@/context/UserDataContext'
import { SearchProvider } from '@/context/SearchContext'
import { FriendsWatchlistProvider } from '@/context/FriendsWatchlistContext'
import { SessionProvider } from '@/context/SessionContext'
import { Toaster } from '@/components/ui/toaster'
import Loading from '@/components/Loading'
import { WithProfileCompleted } from '@/components/auth/WithProfileComplete'
import { ThemeScript } from '@/components/ThemeScript'
import { SWRConfig } from 'swr';
import swrConfig from '@/lib/swr-config';

function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SWRConfig value={swrConfig}>
    <UserDataProvider>
      <FriendsWatchlistProvider>
        <SearchProvider>
          <SessionProvider>
            <ThemeScript />
            <div className="flex flex-col h-screen"> {/* Changed min-h-screen to h-screen */}
              <Navigation />
              <main className="flex-grow overflow-y-auto"> {/* Added overflow-y-auto */}
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center ">
                    <Loading
                      message="Preparing your experience"
                      spinnerType="full"
                    />
                  </div>
                }>
                  <div className="mt-[var(--navbar-height)]">
                    {children}
                  </div>
                </Suspense>
                <Toaster />
              </main>
            </div>
          </SessionProvider>
        </SearchProvider>
      </FriendsWatchlistProvider>
    </UserDataProvider>
    </SWRConfig>
  )
}

export default WithAuth(WithProfileCompleted(RootLayout));
