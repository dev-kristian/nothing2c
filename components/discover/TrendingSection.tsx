'use client';

import React, { useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaPoster from '../MediaPoster';
import SpinningLoader from '../SpinningLoader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import MediaTypeToggle from '../MediaTypeToggle';
import { useTrending } from '@/hooks/discover/useTrending';
import { ApiResponse, DiscoverMediaType } from '@/lib/fetchers';
import { useAuthContext } from '@/context/AuthContext';
import { useAuthUser } from '@/context/AuthUserContext'; // Updated import
import { Skeleton } from '@/components/ui/skeleton';

interface TrendingSectionProps {
  initialData: ApiResponse;
  initialMediaType: DiscoverMediaType;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ initialData, initialMediaType }) => {
  const {
    data,
    isLoading: isTrendingLoading,
    isInitialLoading,
    error,
    hasMore,
    loadMore,
    mediaType,
    setMediaType,
  } = useTrending({ initialData, initialMediaType });

  const { initialAuthChecked } = useAuthContext();
  const { isLoading: isUserDataLoading } = useAuthUser(); // Use new hook

  const isContextLoading = !initialAuthChecked || isUserDataLoading;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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


  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <SpinningLoader />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Alert variant="destructive" className="my-4 frosted-panel border-none">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center">
            {error}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div
      ref={containerRef}
      className="container mx-auto px-4 py-6 overflow-y-auto"
    >
      <motion.div
        className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="md:flex-1">
          <motion.h2
            className="text-2xl md:text-3xl font-bold mb-2 text-foreground" 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            Trending
          </motion.h2>
          <motion.p
            className="text-foreground/60 text-xs md:text-sm max-w-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Discover what&apos;s capturing the world&apos;s attention right now.
          </motion.p>
        </div>

        <motion.div
          className="flex justify-start md:justify-end"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MediaTypeToggle
            mediaType={mediaType}
            onMediaTypeChange={setMediaType}
            showUpcoming={true}
          />
        </motion.div>
      </motion.div>

      {isContextLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="w-full">
              <Skeleton className="aspect-[2/3] rounded-[20px]" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-6"
        >
          <AnimatePresence mode="popLayout">
            {data.map((item) => (
              <motion.div
                key={`${item.id}-${item.media_type || mediaType}`}
                variants={itemVariants}
                layout
                className="w-full"
              >
                <MediaPoster
                  media={{ ...item, media_type: item.media_type || mediaType }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {isTrendingLoading && !isInitialLoading && (
        <motion.div
          className="flex justify-center items-center my-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <SpinningLoader />
        </motion.div>
      )}

      {!isContextLoading && data.length === 0 && !isTrendingLoading && (
        <motion.div
          className="text-center text-muted-foreground my-12 space-y-4 frosted-panel p-8 rounded-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-2xl font-semibold">No items found</p>
          <p className="text-sm">Try adjusting your search or filter</p>
        </motion.div>
      )}

      <div ref={loadMoreTriggerRef} className="h-20" />
    </div>
  );
};

export default TrendingSection;
