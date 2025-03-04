// hooks/useTrending.ts
import { useCallback, useMemo, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { Media } from '@/types/media';

interface TrendingApiResponse {
  results: Media[];
  total_pages: number;
}

interface UseTrendingReturn {
  data: Media[];
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  mediaType: 'movie' | 'tv';
  setMediaType: (type: 'movie' | 'tv') => void;
  refetch: () => void; 
}

const fetcher = async (url: string, mediaType: 'movie' | 'tv', page: number): Promise<TrendingApiResponse> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaType, page }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch trending data');
  }

  return await response.json();
};

export const useTrending = (): UseTrendingReturn => {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');

  const getKey = (pageIndex: number, previousPageData: TrendingApiResponse | null) => {
    if (previousPageData && !previousPageData.results.length) return null;
    return [`/api/trending`, mediaType, pageIndex + 1];
  };

  const {
    data: apiResponses,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate, 
  } = useSWRInfinite<TrendingApiResponse, Error>(getKey, ([url, mediaType, page]) => fetcher(url, mediaType, page), {
      revalidateFirstPage: false, 
  });

  const isLoadingInitialData = !apiResponses && !error;
  const isLoadingMore =
    isLoading || (size > 0 && apiResponses && typeof apiResponses[size - 1] === 'undefined');
  const isEmpty = apiResponses?.[0]?.results.length === 0;
  const isReachingEnd =
    isEmpty || (apiResponses && apiResponses[apiResponses.length - 1]?.results.length < 20);

  const data = useMemo(() => {
    return apiResponses ? apiResponses.flatMap((response) => response.results) : [];
  }, [apiResponses]);


  const uniqueItems = useMemo(() => {
    const seen = new Set<string>();
    return data.filter((item) => {
      const key = `${item.id}-${item.media_type}`;
      return seen.has(key) ? false : seen.add(key);
    });
  }, [data]);

  const loadMore = useCallback(() => {
    if (!isLoadingMore && !isReachingEnd) {
      setSize(size + 1);
    }
  }, [setSize, isLoadingMore, isReachingEnd, size]);

  const hasMore = !isReachingEnd;

  const errorMessage = error
    ? 'An error occurred while fetching trending data. Please try again.'
    : null;

    const refetch = useCallback(() => {
        mutate();
    }, [mutate]);

  return {
    data: uniqueItems,
    isLoading: isLoadingMore || isValidating,
    isInitialLoading: isLoadingInitialData,
    error: errorMessage,
    hasMore,
    loadMore,
    mediaType,
    setMediaType,
    refetch, 
  };
};