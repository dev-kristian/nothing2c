// app/(welcome)/layout.tsx (Refactored to Server Component)
import React from 'react';
import { redirect } from 'next/navigation';
import { getUserProfileStatus } from '@/lib/server-auth-utils'; // Use the server utility
import { Inter } from "next/font/google";
import Image from 'next/image';
import { WelcomeClientWrapper } from '@/components/providers/WelcomeClientWrapper'; // Use the new client wrapper

const inter = Inter({ subsets: ["latin"] });

// Layout is now an async Server Component
export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Perform server-side checks
  const profileStatus = await getUserProfileStatus();

  // Redirect if not authenticated (safeguard)
  if (!profileStatus) {
    console.log('[Welcome Layout] User not authenticated, redirecting to /sign-in');
    redirect('/sign-in');
  }

  // Redirect if profile IS already completed
  if (profileStatus.setupCompleted) {
    console.log('[Welcome Layout] Profile already complete, redirecting to /');
    redirect('/');
  }

  // User is authenticated, profile is incomplete - render welcome layout
  // console.log('[Welcome Layout] Rendering for authenticated user with incomplete profile.');
  return (
    <div className={`${inter.className} min-h-screen flex items-center justify-center p-2`}>
      <div className="max-w-md w-full bg-card rounded-xl p-8 border border-border/50">
        <div className="text-center mb-6">
          <Image
            src="/icons/popcorn.png"
            alt="App Logo"
            width={60}
            height={60}
            className="mx-auto"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        {/* Use client wrapper for children and Toaster */}
        <WelcomeClientWrapper>
          {children}
        </WelcomeClientWrapper>
      </div>
    </div>
  );
}
