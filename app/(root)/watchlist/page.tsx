// WatchlistPage.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUserData } from '@/context/UserDataContext';
import { useScreenSize } from '@/context/ScreenSizeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Loader2, AlertTriangle, ChevronDown, Search, Filter, Info } from 'lucide-react';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import MediaPoster from '@/components/MediaPoster';
import { Media } from '@/types';
import MediaTypeToggle from '@/components/MediaTypeToggle';

export default function WatchlistPage() {
  const { watchlistItems } = useUserData();
  const { isMobile, isTablet, isDesktop, is4K } = useScreenSize();

  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('rating');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [localWatchlistItems, setLocalWatchlistItems] = useState<{ movie: Media[]; tv: Media[] }>(watchlistItems);

  const getInitialVisibleItems = () => {
    if (isMobile) return 8;
    if (isTablet) return 12;
    if (isDesktop) return 15;
    if (is4K) return 18;
    return 12;
  };

  const [visibleItems, setVisibleItems] = useState(getInitialVisibleItems());

  const loaderRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const getGridCols = () => {
    if (isMobile) return 'grid-cols-2';
    if (isTablet) return 'grid-cols-3';
    if (isDesktop) return 'grid-cols-5';
    if (is4K) return 'grid-cols-6';
    return 'grid-cols-4';
  };

  const getMaxWidth = () => {
    if (is4K) return 'max-w-[1800px]';
    if (isDesktop) return 'max-w-[1400px]';
    if (isTablet) return 'max-w-[1024px]';
    return 'max-w-full';
  };

  const getPadding = () => {
    if (isMobile) return 'px-4';
    if (isTablet) return 'px-6';
    return 'px-8';
  };
  
  useEffect(() => {
    setLocalWatchlistItems(watchlistItems);
  }, [watchlistItems]);

  // Apple-style keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command+F or Ctrl+F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredAndSortedItems = React.useMemo(() => {
    let items = [...localWatchlistItems[mediaType]];

    if (debouncedSearchQuery) {
      items = items.filter(item =>
        (item.title || item.name || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    return items.sort((a, b) => {
      switch (sortBy) {
        case 'rating': return (b.vote_average || 0) - (a.vote_average || 0);
        case 'date':
          return new Date(b.release_date || b.first_air_date || 0).getTime() -
            new Date(a.release_date || a.first_air_date || 0).getTime();
        case 'title':
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        default: return 0;
      }
    });
  }, [localWatchlistItems, mediaType, debouncedSearchQuery, sortBy]);

  const loadMoreItems = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleItems((prevVisibleItems) => {
        const increment = isMobile ? 4 : isTablet ? 6 : isDesktop ? 10 : 12;
        return prevVisibleItems + increment;
      });
      setIsLoadingMore(false);
    }, 400);
  }, [isMobile, isTablet, isDesktop]);

  useEffect(() => {
    const currentLoaderRef = loaderRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && filteredAndSortedItems.length > visibleItems && !isLoadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [loadMoreItems, filteredAndSortedItems.length, visibleItems, isLoadingMore]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortLabel = () => {
    switch (sortBy) {
      case 'date': return 'Latest First';
      case 'rating': return 'Top Rated';
      case 'title': return 'A-Z';
      default: return 'Sort By';
    }
  };

  const handleMediaTypeChange = (newMediaType: 'movie' | 'tv') => {
    setMediaType(newMediaType);
    setVisibleItems(getInitialVisibleItems());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-20">
      <div className={`${getMaxWidth()} mx-auto ${getPadding()}`}>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-gradient pb-8"
        >
          My Watchlist
        </motion.h1>

        {/* Controls Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10"
        >
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <MediaTypeToggle
              mediaType={mediaType}
              onMediaTypeChange={handleMediaTypeChange}
            />

            {/* Search & Sort Controls */}
            <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative flex-1">
                <div 
                  className={`
                    frosted-glass rounded-full overflow-hidden transition-all duration-300
                    ${isFocused ? 'ring-2 ring-primary/50 shadow-lg' : 'shadow-md'}
                  `}
                >
                  <div className="flex items-center pl-5">
                    <Search className={`h-4 w-4 mr-2 transition-colors duration-300 ${isFocused ? 'text-primary' : 'text-foreground/50'}`} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search your watchlist..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="w-full bg-transparent text-foreground placeholder-foreground/50 border-none 
                                py-3.5 pr-5 focus:outline-none focus:ring-0"
                    />
                    <AnimatePresence>
                      {searchQuery && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          onClick={handleClearSearch}
                          className="p-2 text-foreground/50 hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {/* Sort Dropdown */}
                <div className="relative z-20" ref={dropdownRef}>
                  <motion.button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full frosted-glass text-foreground px-6 py-3.5 rounded-full
                      flex items-center gap-2 hover:bg-white/10 dark:hover:bg-black/20 transition-all"
                  >
                    <Filter size={16} className="text-primary mr-1" />
                    {sortLabel()}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </motion.button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 mt-2 w-48 frosted-panel"
                      >
                        {[
                          { label: 'Top Rated', value: 'rating' },
                          { label: 'Latest First', value: 'date' },
                          { label: 'A-Z', value: 'title' }
                        ].map((option) => (
                          <motion.button
                            key={option.label}
                            whileHover={{ 
                              backgroundColor: 'rgba(255, 105, 180, 0.1)',
                              transition: { duration: 0.2 }
                            }}
                            onClick={() => {
                              setSortBy(option.value as 'date' | 'rating' | 'title');
                              setIsDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-6 py-3.5 text-foreground transition-all ${
                              sortBy === option.value ? 'bg-primary/10 text-primary font-medium' : ''
                            }`}
                          >
                            {option.label}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-center text-xs text-foreground/40">
            <span>Press </span>
            <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 font-mono text-foreground/70">⌘F</kbd>
            <span> or </span>
            <kbd className="px-1.5 py-0.5 rounded bg-foreground/10 font-mono text-foreground/70">Ctrl+F</kbd>
            <span> to search</span>
          </div>
        </motion.div>

        {/* Empty State */}
        {filteredAndSortedItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="frosted-panel p-12 text-center"
          >
            <div className="max-w-md mx-auto">
              <motion.div 
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {searchQuery ? (
                  <Search className="w-10 h-10 text-primary/50" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-primary/50" />
                )}
              </motion.div>

              <h3 className="text-xl font-medium mb-2">
                {searchQuery
                  ? `No results found for "${searchQuery}"`
                  : `Your ${mediaType === 'movie' ? 'movie' : 'TV show'} watchlist is empty`}
              </h3>

              <p className="text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search or clear the filter to see all items.'
                  : `Add some ${mediaType === 'movie' ? 'movies' : 'TV shows'} to keep track of what you want to watch next.`}
              </p>

              
              {searchQuery && (
                <motion.button
                  onClick={handleClearSearch}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 apple-button"
                >
                  Clear Search
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {filteredAndSortedItems.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`mt-8 grid ${getGridCols()} gap-4 md:gap-6`}
          >
            {filteredAndSortedItems.slice(0, visibleItems).map((media) => (
              <motion.div
                key={media.id}
                variants={itemVariants}
                className="hover-lift"
              >
                <MediaPoster
                  media={media}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load More Indicator */}
        {filteredAndSortedItems.length > visibleItems && (
          <motion.div
            ref={loaderRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center items-center py-12 mt-4"
          >
            {isLoadingMore ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Loading more items...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Clock className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Scroll for more</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Info Footer */}
        {filteredAndSortedItems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 py-6 border-t border-white/10 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center text-muted-foreground text-sm"
          >
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <Info className="w-4 h-4" />
              <p>Showing {Math.min(visibleItems, filteredAndSortedItems.length)} of {filteredAndSortedItems.length} items</p>
            </div>

            <p className="text-foreground/40">Last updated {format(new Date(), 'MMMM d, yyyy')}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
