// app/(welcome)/layout.tsx
import React from 'react';
import { Inter } from "next/font/google";
import Image from 'next/image';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ["latin"] });

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        {children}
        <Toaster />
      </div>
    </div>
  );
}
