'use client';
import React from 'react';
import { Toaster } from '@/components/ui/toaster';

// Simple client wrapper for components needed in WelcomeLayout
export function WelcomeClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Toaster needs to be rendered by a client component */}
      <Toaster />
    </>
  );
}
