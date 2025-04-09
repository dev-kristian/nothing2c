// context/SWRProvider.tsx
'use client';

import { SWRConfig } from 'swr';
import { defaultSWRConfig, fetcher } from '@/lib/swr-config';
import React from 'react';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth

// Define a type for the expected error structure from the fetcher
interface FetchError extends Error {
  status?: number;
  info?: unknown; 
}

export const SWRProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { signOut } = useAuth(); // Get signOut function

  // Define the onError handler
  const handleSWRError = (error: FetchError) => { // Use FetchError type
    // Check if the error status is 401 (Unauthorized)
    if (error?.status === 401) {
      console.warn('SWR detected 401 Unauthorized error. Triggering sign out.');
      // Call signOut to clear client-side auth state
      signOut().catch(err => console.error("Error during automatic sign out:", err)); 
    }
    // Optionally re-throw or handle other errors if needed
  };

  return (
    <SWRConfig 
      value={{
        ...defaultSWRConfig,
        fetcher,
        onError: handleSWRError, // Add the onError handler
      }}
    >
      {children}
    </SWRConfig>
  );
};
