// components/TrendingSection.tsx
import React from 'react';
import { useTrending } from '@/context/TrendingContext';
import MediaInfinite from '@/components/MediaInfinite';
import Spinner from '../Spinner';

const TrendingSection: React.FC = () => {
  const { trendingState, mediaType, timeWindow, isInitialLoading, setMediaType, setTimeWindow, fetchTrending } = useTrending();
  const { data, isLoading, error } = trendingState;

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner  />
      </div>
    );
  }

  return (
    <div>
    <MediaInfinite
      title="Trending"
      items={data}
      isLoading={isLoading}
      error={error}
      mediaType={mediaType}
      setMediaType={setMediaType}
      fetchItems={fetchTrending}
      timeWindow={timeWindow}
      setTimeWindow={setTimeWindow}
    />
    </div>

  );
};


export default TrendingSection;