// hooks/useTrending.ts
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { Media } from '@/types/media';
import { fetcher, ApiResponse, DiscoverMediaType } from '@/lib/fetchers';

interface UseTrendingReturn {
  data: Media[];
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  mediaType: DiscoverMediaType;
  setMediaType: (type: DiscoverMediaType) => void;
  refetch: () => void;
}

interface UseTrendingOptions {
  initialData?: ApiResponse;
  initialMediaType?: DiscoverMediaType;
}

export const useTrending = (options?: UseTrendingOptions): UseTrendingReturn => {
  const searchParams = useSearchParams();
  const urlType = searchParams.get('type');

  const getInitialMediaType = (): DiscoverMediaType => {
    if (options?.initialMediaType) return options.initialMediaType;
    if (urlType === 'movie' || urlType === 'tv' || urlType === 'upcoming') {
      return urlType;
    }
    return 'movie';
  };

  const [mediaType, setMediaTypeState] = useState<DiscoverMediaType>(getInitialMediaType);

  useEffect(() => {
    const currentUrlType = searchParams.get('type');
    if (currentUrlType === 'movie' || currentUrlType === 'tv' || currentUrlType === 'upcoming') {
      if (currentUrlType !== mediaType && currentUrlType !== options?.initialMediaType) {
        setMediaTypeState(currentUrlType);
      }
    }
  }, [searchParams, mediaType, options?.initialMediaType]);

  const getKey = (pageIndex: number, previousPageData: ApiResponse | null) => {
    if (previousPageData && !previousPageData.results.length) return null;
    
    const endpoint = mediaType === 'upcoming' ? '/api/upcoming' : '/api/trending';
    return [endpoint, mediaType, pageIndex + 1]; 
  };

  const {
    data: apiResponses,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate,
  } = useSWRInfinite<ApiResponse, Error>(
    getKey, 
    ([url, type, page]) => fetcher(url, type, page), 
    {
      revalidateFirstPage: false,
      keepPreviousData: true,
      fallbackData: options?.initialData ? [options.initialData] : undefined,
      revalidateOnReconnect: false, // Add this line
      // --- Add these lines ---
      revalidateOnFocus: false,
      revalidateIfStale: false,
      // ----------------------
    }
  );

  const isLoadingInitialData = !apiResponses && !error;
  const isLoadingMore =
    isLoading || (size > 0 && apiResponses && typeof apiResponses[size - 1] === 'undefined');
  const isEmpty = apiResponses?.[0]?.results.length === 0;

  const isReachingEnd = useMemo(() => {
    if (!apiResponses || isEmpty) return true;

    const lastResponse = apiResponses[apiResponses.length - 1];
    if (!lastResponse) return true; 

    if (mediaType === 'upcoming') {
      return lastResponse.page !== undefined && lastResponse.page >= lastResponse.total_pages;
    } else {
      return lastResponse.results.length < 20;
    }
  }, [apiResponses, isEmpty, mediaType]);

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
    ? `An error occurred: ${error.message}` 
    : null;

  const refetch = useCallback(() => {
    setSize(1).then(() => mutate()); 
  }, [mutate, setSize]);

  const handleSetMediaType = useCallback((type: DiscoverMediaType) => {
    setMediaTypeState(type);
    setSize(1); 
  }, [setMediaTypeState, setSize]);

  return {
    data: uniqueItems,
    isLoading: isLoadingMore || isValidating,
    isInitialLoading: isLoadingInitialData,
    error: errorMessage,
    hasMore,
    loadMore,
    mediaType,
    setMediaType: handleSetMediaType, 
    refetch,
  };
};
