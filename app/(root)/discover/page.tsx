'use client'
import React from 'react';
import dynamic from 'next/dynamic';
import SearchComponent from '@/components/discover/SearchComponent';
import Spinner from '@/components/Spinner'; // Import a loading spinner
import Loading from '@/components/Loading';

// Dynamically import TrendingSection, disabling SSR
const TrendingSection = dynamic(() => import('@/components/discover/TrendingSection'), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center min-h-[300px]"><Spinner /></div> // Optional loading state
});

export default function Discover() {
  return (
    // Make this div the scroll container for the page content
    <div className="h-full overflow-y-auto no-scrollbar">
      {/* Add padding inside the scrollable area */}
      <div className="mx-2 md:mx-4 pt-16">
        <SearchComponent className="mb-16" />
        <TrendingSection />
      </div>
    </div>
  );
}
