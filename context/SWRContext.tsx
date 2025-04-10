// context/SWRProvider.tsx
'use client';

import { SWRConfig } from 'swr';
import { defaultSWRConfig, fetcher } from '@/lib/swr-config';
import React from 'react';
import { useAuthContext } from '@/context/AuthContext';

interface FetchError extends Error {
  status?: number;
  info?: unknown; 
}

export const SWRProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { signOut } = useAuthContext();

  const handleSWRError = (error: FetchError) => { 
    if (error?.status === 401) {
      console.warn('SWR detected 401 Unauthorized error. Triggering sign out.');
      signOut().catch(err => console.error("Error during automatic sign out:", err)); 
    }
  };

  return (
    <SWRConfig 
      value={{
        ...defaultSWRConfig,
        fetcher,
        onError: handleSWRError,
      }}
    >
      {children}
    </SWRConfig>
  );
};
