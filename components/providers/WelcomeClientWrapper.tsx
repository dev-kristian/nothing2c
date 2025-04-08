'use client';
import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export function WelcomeClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
