// hooks/useTrending.ts
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { Media } from '@/types/media';

export type DiscoverMediaType = 'movie' | 'tv' | 'upcoming';

interface ApiResponse {
  results: Media[];
  total_pages: number;
  page?: number;
}

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

const fetcher = async (url: string, mediaType: DiscoverMediaType, page: number): Promise<ApiResponse> => {
  const endpoint = mediaType === 'upcoming' ? '/api/upcoming' : '/api/trending';
  
  let requestOptions: RequestInit = {};
  let finalUrl = url; 

  if (mediaType === 'upcoming') {
    finalUrl = `${endpoint}?page=${page}`; 
    requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
  } else {
    requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaType, page }),
    };
    finalUrl = endpoint;
  }

  const response = await fetch(finalUrl, requestOptions);

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to fetch data from ${endpoint}: ${response.statusText} - ${errorData}`);
  }

  return await response.json();
};

export const useTrending = (): UseTrendingReturn => {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type');

  const getInitialMediaType = (): DiscoverMediaType => {
    if (initialType === 'movie' || initialType === 'tv' || initialType === 'upcoming') {
      return initialType;
    }
    return 'movie';
  };

  const [mediaType, setMediaTypeState] = useState<DiscoverMediaType>(getInitialMediaType);

  useEffect(() => {
    const currentUrlType = searchParams.get('type');
    if (currentUrlType === 'movie' || currentUrlType === 'tv' || currentUrlType === 'upcoming') {
      if (currentUrlType !== mediaType) {
        setMediaTypeState(currentUrlType);
      }
    }
  }, [searchParams, mediaType]);

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
  } = useSWRInfinite<ApiResponse, Error>(getKey, ([url, type, page]) => fetcher(url, type, page), {
    revalidateFirstPage: false,
    keepPreviousData: true, 
  });

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
