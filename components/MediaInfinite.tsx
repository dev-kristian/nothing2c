import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import MediaPoster from './MediaPoster';
import Spinner from './Spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Media } from '@/types';

interface MediaInfiniteProps {
  title?: string;
  items: Media[];
  isLoading: boolean;
  error: string | null;
  fetchItems?: () => void;
  mediaType: 'movie' | 'tv';
  setMediaType?: (type: 'movie' | 'tv') => void;
  timeWindow?: 'day' | 'week';
  setTimeWindow?: (window: 'day' | 'week') => void;
}

const MediaInfinite: React.FC<MediaInfiniteProps> = ({
  title,
  items,
  isLoading,
  error,
  fetchItems,
  mediaType,
  setMediaType,
  timeWindow,
  setTimeWindow
}) => {
  const uniqueItems = useMemo(() => {
    const seen = new Set();
    return items.filter(item => {
      const key = `${item.id}-${item.media_type}`;
      return seen.has(key) ? false : seen.add(key);
    });
  }, [items]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && !isLoading && fetchItems) {
      fetchItems();
    }
  }, [isLoading, fetchItems]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0.1,
    });
    
    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [mediaType, timeWindow]);

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <button onClick={fetchItems} className="ml-2 underline">
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="container mx-auto px-4 py-6 overflow-y-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        {title && (
          <h2 className="text-3xl font-bold mb-4 md:mb-0 text-foreground">
            {title}
          </h2>
        )}
        
        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
          {setMediaType && (
            <Tabs 
              value={mediaType} 
              onValueChange={(value) => setMediaType(value as 'movie' | 'tv')}
              className="w-full md:w-auto"
            >
              <TabsList className="bg-secondary/30">
                <TabsTrigger 
                  value="movie" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Movies
                </TabsTrigger>
                <TabsTrigger 
                  value="tv" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  TV Shows
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          
          {setTimeWindow && timeWindow && (
            <Tabs 
              value={timeWindow} 
              onValueChange={(value) => setTimeWindow(value as 'day' | 'week')}
              className="w-full md:w-auto"
            >
              <TabsList className="bg-secondary/30">
                <TabsTrigger 
                  value="day" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Today
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  This Week
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      <div 
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
      >
        {uniqueItems.map((item) => (
          <div
            key={`${item.id}-${item.media_type}`}
            className="w-full"
          >
            <MediaPoster 
              media={{...item, media_type: item.media_type || mediaType}} 
            />
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center my-8">
          <Spinner size={200} />
        </div>
      )}

      {uniqueItems.length === 0 && !isLoading && (
        <div className="text-center text-muted-foreground my-12 space-y-4">
          <p className="text-2xl font-semibold">No items found</p>
          <p className="text-sm">Try adjusting your search or filter</p>
        </div>
      )}

      <div 
        ref={loadMoreTriggerRef} 
        className="flex justify-center items-center mt-8 opacity-50 hover:opacity-100 transition-opacity"
      >
      </div>
    </div>
  );
};

export default React.memo(MediaInfinite);