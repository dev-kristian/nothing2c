'use client';
import React from 'react';
// Removed Toaster import

export function WelcomeClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Removed Toaster instance */}
    </>
  );
}
