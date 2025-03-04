// context/SWRProvider.tsx
'use client';

import { SWRConfig } from 'swr';
import { defaultSWRConfig, fetcher } from '@/lib/swr-config';
import React from 'react';

export const SWRProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <SWRConfig 
      value={{
        ...defaultSWRConfig,
        fetcher,
      }}
    >
      {children}
    </SWRConfig>
  );
};
