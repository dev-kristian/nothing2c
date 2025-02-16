'use client'
import React from 'react';
import SearchComponent from '@/components/explore/SearchComponent';
import TrendingSection from '@/components/explore/TrendingSection';

export default function Explore() {
  return (
    <div className="mx-2 md:mx-4 pt-16">
      <SearchComponent className="mb-8" />
      <TrendingSection />
    </div>
  );
}