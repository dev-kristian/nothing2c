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
      <div className="max-w-6xl w-full bg-card rounded-3xl overflow-hidden flex flex-col md:flex-row border border-border/50">
        <div className="w-full md:w-1/2 md:p-2">
          <div className="text-center">
            <Image 
              src="/icons/popcorn.png" 
              alt="App Logo" 
              width={80} 
              height={80} 
              className="mx-auto"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          {children}
        </div>

        <div className="hidden md:block w-1/2 relative">
          <Image
            src="/images/auth-background.jpg"
            alt="Authentication background"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background/90">
            {/* Optional: Add content overlay */}
          </div>
        </div>
      </div>
    </div>
  );
}
