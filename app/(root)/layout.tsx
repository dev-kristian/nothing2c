// app/(root)/layout.tsx (Refactored to Server Component)
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getUserProfileStatus } from '@/lib/server-auth-utils'; // Use the server utility
import { ClientProviders } from '@/components/providers/ClientProviders'; // Use the new client wrapper
import Navigation from '@/components/Navigation';
import Loading from '@/components/Loading'; // Keep Loading for Suspense fallback

// Layout is now an async Server Component
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Perform server-side checks
  const profileStatus = await getUserProfileStatus();

  // Redirect if not authenticated (safeguard)
  if (!profileStatus) {
    console.log('[Root Layout] User not authenticated, redirecting to /sign-in');
    redirect('/sign-in');
  }

  // Redirect if profile is not completed
  if (!profileStatus.setupCompleted) {
    console.log('[Root Layout] Profile not complete, redirecting to /welcome');
    redirect('/welcome');
  }

  // User is authenticated and profile is complete, render the layout
  // console.log('[Root Layout] Rendering for authenticated user with complete profile.');
  return (
    <>
      <div className="flex flex-col h-screen">
        <Navigation /> {/* Navigation might need to be a Client Component if it uses hooks */}
        {/* Removed overflow-y-auto from main */}
        <main className="flex-grow">
          {/* Suspense wraps the client-rendered parts */}
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center mt-[var(--navbar-height)]">
              <Loading
                message="Loading content..." // Updated message
                spinnerType="full"
              />
            </div>
          }>
            <div className="mt-[var(--navbar-height)]">
              {/* ClientProviders wraps children and contains all context providers + Toaster */}
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

// Removed HOC wrappers (WithAuth, WithProfileCompleted)
