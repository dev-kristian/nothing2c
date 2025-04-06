// hooks/useTrending.ts
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { Media } from '@/types/media';

// Define a union type for the possible media types
export type DiscoverMediaType = 'movie' | 'tv' | 'upcoming';

interface ApiResponse {
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
  mediaType: DiscoverMediaType;
  setMediaType: (type: DiscoverMediaType) => void;
  refetch: () => void;
}

const fetcher = async (url: string, mediaType: DiscoverMediaType, page: number): Promise<ApiResponse> => {
  // Use the correct API endpoint based on mediaType
  const endpoint = mediaType === 'upcoming' ? '/api/upcoming' : '/api/trending';
  
  let requestOptions: RequestInit = {};
  let finalUrl = url; // Use the endpoint passed in the key

  if (mediaType === 'upcoming') {
    // Upcoming uses GET and page as a query param
    finalUrl = `${endpoint}?page=${page}`; // Construct URL with query param
    requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // No body for GET
    };
  } else {
    // Trending uses POST with mediaType and page in the body
    requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaType, page }),
    };
    finalUrl = endpoint; // Use the base trending endpoint
  }

  const response = await fetch(finalUrl, requestOptions);

  if (!response.ok) {
    const errorData = await response.text(); // Get more error details
    throw new Error(`Failed to fetch data from ${endpoint}: ${response.statusText} - ${errorData}`);
  }

  return await response.json();
};

export const useTrending = (): UseTrendingReturn => {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type');

  // Determine initial media type, including 'upcoming'
  const getInitialMediaType = (): DiscoverMediaType => {
    if (initialType === 'movie' || initialType === 'tv' || initialType === 'upcoming') {
      return initialType;
    }
    return 'movie'; // Default to 'movie'
  };

  const [mediaType, setMediaTypeState] = useState<DiscoverMediaType>(getInitialMediaType);

  // Update state if searchParams change
  useEffect(() => {
    const currentUrlType = searchParams.get('type');
    if (currentUrlType === 'movie' || currentUrlType === 'tv' || currentUrlType === 'upcoming') {
      if (currentUrlType !== mediaType) {
        setMediaTypeState(currentUrlType);
      }
    }
  }, [searchParams, mediaType]);

  const getKey = (pageIndex: number, previousPageData: ApiResponse | null) => {
    // Stop fetching if the previous page had no results
    if (previousPageData && !previousPageData.results.length) return null;
    
    // Key includes the API endpoint and mediaType to ensure correct fetching and caching
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
    // Keep previous data visible while loading new mediaType
    keepPreviousData: true, 
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
    ? `An error occurred: ${error.message}` // Provide more specific error
    : null;

  const refetch = useCallback(() => {
    // Reset size to 1 and trigger revalidation
    setSize(1).then(() => mutate()); 
  }, [mutate, setSize]);

  // Function to handle media type change, resetting pagination
  const handleSetMediaType = useCallback((type: DiscoverMediaType) => {
    setMediaTypeState(type);
    // Reset SWR state by setting size to 1 when type changes
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
    setMediaType: handleSetMediaType, // Use the new handler
    refetch,
  };
};
