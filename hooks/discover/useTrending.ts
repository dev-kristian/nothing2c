// hooks/useTrending.ts
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation'; // Import useSearchParams
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
  const searchParams = useSearchParams(); // Get search params
  const initialType = searchParams.get('type'); // Get 'type' param

  // Determine initial media type based on URL param, default to 'movie'
  const getInitialMediaType = (): 'movie' | 'tv' => {
    if (initialType === 'movie' || initialType === 'tv') {
      return initialType;
    }
    return 'movie';
  };

  const [mediaType, setMediaTypeState] = useState<'movie' | 'tv'>(getInitialMediaType);

  // Update state if searchParams change after initial load
  useEffect(() => {
    const currentUrlType = searchParams.get('type');
    if (currentUrlType === 'movie' || currentUrlType === 'tv') {
      if (currentUrlType !== mediaType) {
        setMediaTypeState(currentUrlType);
      }
    }
    // Only run when searchParams change
  }, [searchParams, mediaType]);


  const getKey = (pageIndex: number, previousPageData: TrendingApiResponse | null) => {
    // Ensure mediaType is included in the key so SWR refetches when it changes
    if (previousPageData && !previousPageData.results.length) return null;
    return [`/api/trending`, mediaType, pageIndex + 1]; // Include mediaType in the key
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
    setMediaType: setMediaTypeState, // Rename internal state setter
    refetch,
  };
};
