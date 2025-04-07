// app/(root)/layout.tsx 
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUserProfileStatus } from '@/lib/server-auth-utils';
import { ClientProviders } from '@/components/providers/ClientProviders';
import Navigation from '@/components/Navigation';
import SpinningLoader from '@/components/SpinningLoader';

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

  // Middleware already handles redirecting users without usernames to /welcome.
  // Users with usernames should be allowed into root routes.
  // The /welcome page itself should manage completion steps.
  // if (!profileStatus.setupCompleted) {
  //   console.log('[Root Layout] Profile not complete, redirecting to /welcome');
  //   redirect('/welcome');
  // }

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
            <div className="mt-[var(--navbar-height)]">
              <ClientProviders>
                {children}
              </ClientProviders>
            </div>
          </Suspense>
        </main>
      </div>
    </>
  );
}
