// app/search/[query]/page.tsx
'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation'; // Import useRouter
import { Loader2, ArrowLeft } from 'lucide-react';
import useSWRInfinite from 'swr/infinite';
import MediaPoster from '@/components/MediaPoster';
import { Media, SearchResult } from '@/types';
import SpinningLoader from '@/components/SpinningLoader';
import SearchComponent from '@/components/discover/SearchComponent'; // Import SearchComponent
import { Button } from '@/components/ui/button';
import { GENRES_BY_TYPE, Genre } from '@/constants/genres'; // Import GENRES_BY_TYPE and Genre

interface SearchApiResponse {
  results: SearchResult[];
  total_pages: number;
  page: number;
  total_results: number;
}

const fetcher = async (url: string): Promise<SearchApiResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch search results');
  }
  return response.json();
};

function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this;
    
    const later = () => {
      timeoutId = null;
      func.apply(context, args);
    };

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(later, wait);
  } as T;
}

export default function SearchResultsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const query = params.query as string | undefined;
  const type = searchParams.get('type') || 'multi';
  const year = searchParams.get('year') || undefined;
  const genre = searchParams.get('genre') || undefined;
  const includeAdult = searchParams.get('adult') === 'true';

  const getKey = (pageIndex: number, previousPageData: SearchApiResponse | null): string | null => {
    if (previousPageData && !previousPageData.results.length) return null;
    if (previousPageData && previousPageData.page >= previousPageData.total_pages) return null;
    if (pageIndex === 0) {
      const urlParams = new URLSearchParams();
      const currentQuery = query === 'discover' ? undefined : query;
      if (currentQuery) urlParams.append('query', currentQuery);
      urlParams.append('type', type);
      if (year) urlParams.append('year', year);
      if (genre) urlParams.append('genre', genre);
      urlParams.append('include_adult', includeAdult.toString());
      urlParams.append('page', '1'); 
      return `/api/search?${urlParams.toString()}`;
    }

    const urlParams = new URLSearchParams();
    const currentQuery = query === 'discover' ? undefined : query;
    if (currentQuery) urlParams.append('query', currentQuery);
    urlParams.append('type', type);
    if (year) urlParams.append('year', year);
    if (genre) urlParams.append('genre', genre);
    urlParams.append('include_adult', includeAdult.toString());
    urlParams.append('page', (pageIndex + 1).toString());

    return `/api/search?${urlParams.toString()}`;
  };

  const {
    data: apiResponses,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite<SearchApiResponse, Error>(getKey, fetcher, {
    revalidateFirstPage: false,
    parallel: true,
    keepPreviousData: true,
  });

  const results = useMemo(() => {
    const allResults = apiResponses?.flatMap(page => page.results) ?? [];
    const uniqueResults: SearchResult[] = []; 
    const seenKeys = new Set<string>();

    // Corrected loop: Iterate through all fetched results
    for (const result of allResults) {
      if (result.id === undefined) {
        console.warn('SearchResult missing id:', result);
        continue;
      }

      let determinedType = result.media_type; // Start with API response type

      if (!determinedType) { // If API didn't provide type...
        if (type === 'movie' || type === 'tv') {
          determinedType = type; // Use page type for specific movie/tv searches
        } else {
          // This case indicates a multi-search result is missing media_type, which is unexpected for TMDB.
          console.warn("Multi-search result unexpectedly missing media_type:", result);
          // Skip this result as we can't reliably determine its type or key.
          continue; 
        }
      }

      // Ensure the determined type is one we handle
      if (!['movie', 'tv', 'person'].includes(determinedType)) {
         console.warn('Result has unexpected media_type:', result, 'Type:', determinedType);
         continue;
      }

      const key = `${determinedType}-${result.id}`;
      if (!seenKeys.has(key)) {
        // Ensure the result object consistently has the determined media_type
        const resultWithGuaranteedType = {
          ...result,
          media_type: determinedType as 'movie' | 'tv' | 'person'
        };
        uniqueResults.push(resultWithGuaranteedType);
        seenKeys.add(key);
      }
    }
    return uniqueResults;
  }, [apiResponses, type]); // <-- Added 'type' to dependency array

  const isLoadingInitialData = !apiResponses && !error && isLoading;
  const isLoadingMore = isLoading && size > 1;
  const isEmpty = apiResponses?.[0]?.results?.length === 0 && !isLoadingInitialData; // Check after initial load

  const isReachingEnd = useMemo(() => {
    if (!apiResponses || apiResponses.length === 0) return false; // No data yet
    const lastPage = apiResponses[apiResponses.length - 1];
    const reachedTotalPages = lastPage.page >= lastPage.total_pages;
    const lastPageIsEmpty = !lastPage.results?.length;
    
    return reachedTotalPages || lastPageIsEmpty;
  }, [apiResponses]);

  const hasMore = !isReachingEnd && !error;
  const errorMessage = error ? `An error occurred: ${error.message}` : null;

  const observer = useRef<IntersectionObserver>();
  const lastItemRef = useRef<HTMLDivElement>(null);

  const debouncedSetSize = useMemo(
    () => debounce((newSize: number) => setSize(newSize), 300),
    [setSize] 
  );

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading && !isValidating) {
      debouncedSetSize(size + 1);
    }
  }, [hasMore, isLoading, isValidating, size, debouncedSetSize]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore) {
        loadMore();
      }
    },
    [hasMore, loadMore] 
  );

  useEffect(() => {
    const currentObserver = new IntersectionObserver(handleObserver, {
      root: null,
      threshold: 0.5, 
    });
    const currentLastItem = lastItemRef.current;

    if (observer.current) {
      observer.current.disconnect();
    }
    observer.current = currentObserver; 

    if (currentLastItem && hasMore) {
      currentObserver.observe(currentLastItem);
    }

    return () => {
      if (currentLastItem) {
        currentObserver.unobserve(currentLastItem);
      }
      currentObserver.disconnect();
    };
  }, [handleObserver, hasMore]);
  
  const getPageTitle = () => {
    const displayQuery = query === 'discover' ? undefined : query;
    if (displayQuery) {
      return `Search results for "${displayQuery}"`;
    }
    
    const parts = []
    if (type !== 'multi') {
      parts.push(type === 'movie' ? 'Movies' : type === 'tv' ? 'TV Shows' : 'People')
    }
    if (year) parts.push(`from ${year}`)
    if (genre) {
      // Use imported GENRES_BY_TYPE constant based on the current type
      const currentGenreList: Genre[] = GENRES_BY_TYPE[type] || GENRES_BY_TYPE['multi'];
      const genreName = currentGenreList.find(g => g.id.toString() === genre)?.name;
      if (genreName) parts.push(genreName);
    }
    return parts.length > 0 
      ? `Discovering ${parts.join(' ')}` 
       : 'Discover content'
   }
 
   return (
     <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6 gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-pink">{getPageTitle()}</h1>
      </div>

       <div className="mb-8">
         <SearchComponent 
           initialQuery={query === 'discover' ? '' : query}
           initialType={type}
           initialYear={year}
            initialGenre={genre}
            initialIncludeAdult={includeAdult}
           hideTitleSection={true}
          />
        </div>

      {isLoadingInitialData ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-pink" />
        </div>
      ) : errorMessage ? (
        <div className="text-center py-10">
          <p className="text-red-500">{errorMessage}</p>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-10">
          <p className="text-lg">No results found for your criteria.</p>
          <p className="text-foreground/60 mt-2">Try adjusting the search above or the filters.</p>
        </div>
      ) : (
        <>
          {!isLoadingInitialData && !isEmpty && apiResponses && apiResponses.length > 0 && (
            <div className="flex justify-end text-sm text-foreground/60 mb-4 space-x-4">
              {apiResponses[0]?.total_results !== undefined && (
                 <span>
                   {apiResponses[0].total_results.toLocaleString()} Result{apiResponses[0].total_results !== 1 ? 's' : ''}
                 </span>
              )}
              {apiResponses[0]?.total_pages > 0 && (
                <span>
                  Page {apiResponses[apiResponses.length - 1]?.page || '?'} of {apiResponses[0]?.total_pages || '?'}
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* The 'results' array now contains objects with guaranteed correct media_type ('movie', 'tv', or 'person') */}
            {/* thanks to the updated useMemo hook. */}
            {results.map((result, index) => {
              const isLastItem = index === results.length - 1;

              // No need to filter here or reconstruct mediaData. 
              // MediaPoster handles different media types internally.
              // The key should use the guaranteed media_type from the result object.
              return (
                <div key={`${result.media_type}-${result.id}`} ref={isLastItem ? lastItemRef : null}>
                  {/* Pass the result object directly, it has the correct media_type */}
                  <MediaPoster media={result} />
                </div>
              );
            })}
          </div>

          {(isLoadingMore || (isValidating && !isLoadingInitialData)) && (
            <div className="flex justify-center items-center my-8" aria-live="polite" aria-busy="true">
              <SpinningLoader />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Removed the local genres definition
