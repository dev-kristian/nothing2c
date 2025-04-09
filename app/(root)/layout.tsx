// app/(root)/layout.tsx 
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUserProfileStatus } from '@/lib/server-auth-utils';
import { ClientProviders } from '@/components/providers/ClientProviders';
import Navigation from '@/components/Navigation';
import SpinningLoader from '@/components/SpinningLoader';
import PullToRefreshWrapper from '@/components/PullToRefreshWrapper'; // Import the new wrapper

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profileStatus = await getUserProfileStatus();

  if (!profileStatus) {
    console.log('[Root Layout] User not authenticated, redirecting to /sign-in');
    redirect('/sign-in');
  }

  return (
    <>
      <div className="flex flex-col h-screen">
        <Navigation /> 
        <main className="flex-grow">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center mt-[var(--navbar-height)]">
              <SpinningLoader />
            </div>
          }>
            {/* Wrap the content area with PullToRefreshWrapper */}
            <PullToRefreshWrapper> 
              <div className="mt-[var(--navbar-height)]">
                <ClientProviders>
                  {children}
                </ClientProviders>
              </div>
            </PullToRefreshWrapper>
          </Suspense>
        </main>
      </div>
    </>
  );
}
