// app/(root)/layout.tsx
'use client'

import React, { Suspense } from 'react'
import Navigation from '@/components/Navigation'
import { WithAuth } from '@/components/auth/WithAuth'
import { UserDataProvider } from '@/context/UserDataContext'
import { SearchProvider } from '@/context/SearchContext'
import { TopWatchlistProvider } from '@/context/TopWatchlistContext'
import { SessionProvider } from '@/context/SessionContext'
import { Toaster } from '@/components/ui/toaster'
import Loading from '@/components/Loading'
import { WithProfileCompleted } from '@/components/auth/WithProfileComplete'
import { ThemeScript } from '@/components/ThemeScript'

function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserDataProvider>
      <TopWatchlistProvider>
        <SearchProvider>
          <SessionProvider>
            <ThemeScript />
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-grow">
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
      </TopWatchlistProvider>
    </UserDataProvider>
  )
}

export default WithAuth(WithProfileCompleted(RootLayout));