
import { useCallback, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWRInfinite, { SWRInfiniteResponse } from 'swr/infinite';
import { Media } from '@/types/media';
import { fetcher, ApiResponse, DiscoverMediaType } from '@/lib/fetchers';


type SWRInfiniteHookResponse = SWRInfiniteResponse<ApiResponse, Error>;

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


const swrOptions = {
  revalidateFirstPage: false,
  revalidateOnReconnect: false,
  revalidateOnFocus: false,
  
};


const processSWRData = (apiResponses: ApiResponse[] | undefined): Media[] => {
  const data = apiResponses ? apiResponses.flatMap((response) => response.results) : [];
  
  const seen = new Set<string>();
  return data.filter((item) => {
    const key = `${item.id}-${item.media_type || 'unknown'}`; 
    return seen.has(key) ? false : seen.add(key);
  });
};


const calculateIsReachingEnd = (
  apiResponses: ApiResponse[] | undefined,
  mediaType: 'movie' | 'tv' | 'upcoming' 
): boolean => {
  if (!apiResponses || apiResponses?.[0]?.results.length === 0) return true;

  const lastResponse = apiResponses[apiResponses.length - 1];
  if (!lastResponse) return true;

  
  if (mediaType === 'upcoming') {
    return lastResponse.page !== undefined && lastResponse.page >= lastResponse.total_pages;
  } else {
    
    return lastResponse.results.length < 20;
  }
};

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

  

  const movieSWR: SWRInfiniteHookResponse = useSWRInfinite(
    (pageIndex, prevData) => {
      if (prevData && !prevData.results.length) return null;
      return ['/api/trending', 'movie', pageIndex + 1];
    },
    
    ([url, type, page]) => fetcher(url, type as DiscoverMediaType, page),
    {
      ...swrOptions,
      fallbackData: mediaType === 'movie' && options?.initialData ? [options.initialData] : undefined,
    }
  );

  const tvSWR: SWRInfiniteHookResponse = useSWRInfinite(
    (pageIndex, prevData) => {
      if (prevData && !prevData.results.length) return null;
      return ['/api/trending', 'tv', pageIndex + 1];
    },
    
    ([url, type, page]) => fetcher(url, type as DiscoverMediaType, page),
    {
      ...swrOptions,
      fallbackData: mediaType === 'tv' && options?.initialData ? [options.initialData] : undefined,
    }
  );

  const upcomingSWR: SWRInfiniteHookResponse = useSWRInfinite(
    (pageIndex, prevData) => {
      if (prevData && !prevData.results.length) return null;
      
      return ['/api/upcoming', 'upcoming', pageIndex + 1]; 
    },
    
    ([url, , page]) => fetcher(url, 'upcoming', page), 
    {
      ...swrOptions,
      fallbackData: mediaType === 'upcoming' && options?.initialData ? [options.initialData] : undefined,
    }
  );

  

  const activeSWR = useMemo(() => {
    switch (mediaType) {
      case 'tv':
        return tvSWR;
      case 'upcoming':
        return upcomingSWR;
      case 'movie':
      default:
        return movieSWR;
    }
  }, [mediaType, movieSWR, tvSWR, upcomingSWR]);

  

  const {
    data: apiResponses,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate,
  } = activeSWR;

  const processedData = useMemo(() => processSWRData(apiResponses), [apiResponses]);
  const isReachingEnd = useMemo(() => calculateIsReachingEnd(apiResponses, mediaType), [apiResponses, mediaType]);
  const hasMore = !isReachingEnd;
  const errorMessage = error ? `An error occurred: ${error.message}` : null;

  
  const isInitialLoading = !apiResponses && !error;
  
  const isLoadingMore = isLoading || isValidating;


  

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      setSize(size + 1);
    }
  }, [setSize, isLoadingMore, hasMore, size]);

  const refetch = useCallback(() => {
    
    setSize(1).then(() => mutate());
  }, [mutate, setSize]);

  
  const handleSetMediaType = useCallback((type: DiscoverMediaType) => {
      setMediaTypeState(type);

      
      
      switch (type) {
          case 'movie':
              
              movieSWR.setSize?.(1);
              break;
          case 'tv':
              tvSWR.setSize?.(1);
              break;
          case 'upcoming':
              upcomingSWR.setSize?.(1);
              break;
      }
  }, [setMediaTypeState, movieSWR, tvSWR, upcomingSWR]); 

  
  useEffect(() => {
    const currentUrlType = searchParams.get('type');
    if (currentUrlType === 'movie' || currentUrlType === 'tv' || currentUrlType === 'upcoming') {
      
      
      if (currentUrlType !== mediaType) {
         setMediaTypeState(currentUrlType);
      }
    }
     
     
  }, [searchParams, mediaType]);


  return {
    data: processedData,
    isLoading: isLoadingMore, 
    isInitialLoading: isInitialLoading,
    error: errorMessage,
    hasMore,
    loadMore,
    mediaType,
    setMediaType: handleSetMediaType,
    refetch,
  };
};
