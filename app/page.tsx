'use client'
import React from 'react';
import dynamic from 'next/dynamic';
import SearchComponent from '@/components/discover/SearchComponent';
import SpinningLoader from '@/components/SpinningLoader';

const TrendingSection = dynamic(() => import('@/components/discover/TrendingSection'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center min-h-[300px]"><SpinningLoader /></div>
});

// Renamed function to reflect it's the main page now
export default function HomePage() {
  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-2 md:mx-4"> 
        <SearchComponent className="my-6" />
        <TrendingSection />
      </div>
    </div>
  );
}
