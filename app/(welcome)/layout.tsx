// app/(welcome)/layout.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { getUserProfileStatus } from '@/lib/server-auth-utils';
import { Inter } from "next/font/google";
import Image from 'next/image';
import { WelcomeClientWrapper } from '@/components/providers/WelcomeClientWrapper';

const inter = Inter({ subsets: ["latin"] });

export default async function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profileStatus = await getUserProfileStatus();

  if (!profileStatus) {
    console.log('[Welcome Layout] User not authenticated, redirecting to /sign-in');
    redirect('/sign-in');
  }

  if (profileStatus.setupCompleted) {
    console.log('[Welcome Layout] Profile already complete, redirecting to /');
    redirect('/');
  }

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
        <WelcomeClientWrapper>
          {children}
        </WelcomeClientWrapper>
      </div>
    </div>
  );
}
