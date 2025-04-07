// app/(auth)/layout.tsx
import React from 'react';
import { Inter } from "next/font/google";
import Image from 'next/image';

const inter = Inter({ subsets: ["latin"] });

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`${inter.className} min-h-screen flex items-center justify-center p-2`}>
      <div className="max-w-xl w-full bg-card rounded-3xl overflow-hidden border border-border/50 relative">
        <Image
          src="/images/auth-background.jpg"
          alt="Authentication background"
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
          className="opacity-10 z-0" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-pink/10 via-background/70 to-background/90 z-0"></div>

        <div className="relative z-10"> 
          <div className="text-center">
            <Image
              src="/icons/popcorn.png"
              alt="App Logo"
              width={80}
              height={80}
              className="mx-auto"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
