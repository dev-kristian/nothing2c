'use client'
import React from 'react';
import dynamic from 'next/dynamic';
import SearchComponent from '@/components/discover/SearchComponent';
import SpinningLoader from '@/components/SpinningLoader'; // Changed import

const TrendingSection = dynamic(() => import('@/components/discover/TrendingSection'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center min-h-[300px]"><SpinningLoader /></div> // Replaced Spinner with SpinningLoader
});

export default function Discover() {
  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-2 md:mx-4 pt-16">
        <SearchComponent className="mb-16" />
        <TrendingSection />
      </div>
    </div>
  );
}
