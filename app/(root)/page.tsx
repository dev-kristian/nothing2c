//app\(root)\page.tsx
'use client'
import React from 'react';
import SearchComponent from '@/components/discover/SearchComponent';
import TrendingSection from '@/components/discover/TrendingSection';

export default function Discover() {
  return (
    <div className="mx-2 md:mx-4 pt-16">
      <SearchComponent className="mb-16" />
      <TrendingSection />
    </div>
  );
}