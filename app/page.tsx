import React from 'react';
import SearchComponent from '@/components/discover/SearchComponent';
import TrendingSection from '@/components/discover/TrendingSection';
import { fetcher, ApiResponse } from '@/lib/fetchers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  let initialTrendingData: ApiResponse | null = null;
  let fetchError: string | null = null;
  const resolvedSearchParams = await searchParams;
  const mediaTypeParam = resolvedSearchParams?.type;
  const normalizedMediaType = Array.isArray(mediaTypeParam)
    ? mediaTypeParam[0]
    : mediaTypeParam;

  const initialMediaType =
    normalizedMediaType === 'tv' || normalizedMediaType === 'upcoming'
      ? normalizedMediaType
      : 'movie';

  try {
    initialTrendingData = await fetcher(
        initialMediaType === 'upcoming' ? '/api/upcoming' : '/api/trending',
        initialMediaType,
        1
      );
  } catch (error) {
    console.error("[HomePage Fetch Error - Trending Only]", error);
    fetchError = error instanceof Error ? error.message : "An unknown error occurred while fetching trending data.";
    initialTrendingData = { results: [], total_pages: 0, page: 1 };
  }

  if (!initialTrendingData) {
      initialTrendingData = { results: [], total_pages: 0, page: 1 };
      if (!fetchError) fetchError = "Failed to load initial trending data.";
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-2 md:mx-4"> 
        <SearchComponent className="my-6" /> 

        {fetchError && (
          <Alert variant="destructive" className="my-4">
            <AlertTitle>Error Loading Trending Section</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
        )}

        <TrendingSection
          initialData={initialTrendingData}
          initialMediaType={initialMediaType}
        />
      </div>
    </div>
  );
}
