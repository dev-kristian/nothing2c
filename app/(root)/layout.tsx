// app/(root)/layout.tsx 
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthenticatedUserProfile } from '@/lib/server-auth-utils'; 
import SpinningLoader from '@/components/SpinningLoader';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userProfile = await getAuthenticatedUserProfile(); 

  if (!userProfile) {
    console.log('[Root Layout] User not authenticated, redirecting to /sign-in');
    redirect('/sign-in');
  }

  return (
    <>
      <main className="flex-grow"> 
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
              <SpinningLoader />
            </div>
          }>
            <div>
              {children}
            </div>
          </Suspense>
        </main>
    </>
  );
}
