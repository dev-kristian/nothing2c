// Simplified animation approach for WatchlistSection.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUserData } from '@/context/UserDataContext';
import { Clock, X, Loader2, AlertTriangle, ChevronDown, Search, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import MediaPoster from '@/components/MediaPoster';
import MediaTypeToggle from '@/components/MediaTypeToggle';

// Define interface for EmptyState props
interface EmptyStateProps {
  mediaType: 'movie' | 'tv';
  searchQuery: string;
  onClearSearch: () => void;
}

const MemoizedMediaPoster = React.memo(MediaPoster);

export function WatchlistSection() {
  const { watchlistItems } = useUserData();

  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('rating');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Define batch sizes - simplified as grid handles visual layout
  const initialBatchSize = 8;
  const batchSize = 8;

  const [visibleItems, setVisibleItems] = useState(initialBatchSize);
  
  const loaderRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Grid columns defined directly with Tailwind responsive classes
  const gridCols = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset visible items when media type changes
  useEffect(() => {
    setVisibleItems(initialBatchSize);
    
    // Small delay to ensure DOM is updated before reconnecting observer
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && filteredAndSortedItems.length > visibleItems && !isLoadingMore) {
            loadMoreItems();
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );
      
      const currentLoader = loaderRef.current;
      if (currentLoader) {
        observer.observe(currentLoader);
      }
      
      return () => {
        if (currentLoader) {
          observer.unobserve(currentLoader);
        }
        observer.disconnect();
      };
    }, 300);
    
    return () => clearTimeout(timer);
  }, [mediaType, initialBatchSize]);

  // Reset visible items when sort or search changes
  useEffect(() => {
    setVisibleItems(initialBatchSize);
  }, [sortBy, debouncedSearchQuery, initialBatchSize]);

  const filteredAndSortedItems = useMemo(() => {
    const items = [...watchlistItems[mediaType]];
    if (debouncedSearchQuery) {
      return items.filter(item =>
        (item.title || item.name || '').toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      ).sort((a, b) => {
        switch (sortBy) {
          case 'rating': return (b.vote_average || 0) - (a.vote_average || 0);
          case 'date': return new Date(b.release_date || b.first_air_date || 0).getTime() -
                              new Date(a.release_date || a.first_air_date || 0).getTime();
          case 'title': return (a.title || a.name || '').localeCompare(b.title || b.name || '');
          default: return 0;
        }
      });
    }
    return items.sort((a, b) => {
      switch (sortBy) {
        case 'rating': return (b.vote_average || 0) - (a.vote_average || 0);
        case 'date': return new Date(b.release_date || b.first_air_date || 0).getTime() -
                            new Date(a.release_date || a.first_air_date || 0).getTime();
        case 'title': return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        default: return 0;
      }
    });
  }, [watchlistItems, mediaType, debouncedSearchQuery, sortBy]);

  // Load more items function
  const loadMoreItems = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    
    // Use setTimeout to simulate loading and prevent UI freezing
    setTimeout(() => {
      setVisibleItems(prev => prev + batchSize);
      setIsLoadingMore(false);
    }, 300);
  }, [isLoadingMore, batchSize]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && filteredAndSortedItems.length > visibleItems && !isLoadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }
    
    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
      observer.disconnect();
    };
  }, [filteredAndSortedItems.length, visibleItems, isLoadingMore, loadMoreItems, sortBy, debouncedSearchQuery]);

  const handleMediaTypeChange = useCallback((newMediaType: 'movie' | 'tv') => {
    setMediaType(newMediaType);
    setVisibleItems(initialBatchSize);
  }, [initialBatchSize]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  const sortLabel = useCallback(() => {
    return sortBy === 'date' ? 'Latest First' :
           sortBy === 'rating' ? 'Top Rated' :
           sortBy === 'title' ? 'A-Z' : 'Sort By';
  }, [sortBy]);

  // Show items up to the current visible count
  const displayItems = filteredAndSortedItems.slice(0, visibleItems);
  const hasMoreItems = filteredAndSortedItems.length > visibleItems;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Your Watchlist</h2>
          <p className="text-sm text-foreground/60">
            {watchlistItems[mediaType].length} {mediaType === 'movie' ? 'movies' : 'shows'} saved
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className={`
              frosted-panel rounded-full overflow-hidden transition-all duration-300 p-0
              ${isFocused ? 'ring-2 ring-pink/50 shadow-lg' : ''}
            `}>
              <div className="flex items-center pl-4">
                <Search className={`h-4 w-4 mr-2 transition-colors duration-300 ${isFocused ? 'text-pink' : 'text-foreground/50'}`} />
                <input
                  ref={searchInputRef}
                  placeholder="Search watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full bg-transparent text-foreground placeholder-foreground/50 border-none 
                  py-2.5 pr-4 text-sm focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-2 text-foreground/50 hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-20" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="flex items-center space-x-2 px-3 py-2 frosted-panel rounded-full"
            >
              <Filter size={14} className="text-pink" />
              <span className="text-xs font-medium">{sortLabel()}</span>
              <ChevronDown className={`w-3 h-3 text-foreground/70 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 z-10 mt-2 w-48 rounded-xl shadow-lg p-1 frosted-panel space-y-1">
                {['rating', 'date', 'title'].map(option => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option as 'rating' | 'date' | 'title');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${sortBy === option ? 'bg-pink text-white' : 'hover:bg-foreground/10'}`}
                  >
                    {option === 'rating' ? 'Top Rated' : option === 'date' ? 'Latest First' : 'A-Z'}
                  </button>
                ))}
              </div>
            )}
          </div>

          <MediaTypeToggle 
            mediaType={mediaType} 
            onMediaTypeChange={handleMediaTypeChange}
            compact={true} 
          />
        </div>
      </div>

      {displayItems.length > 0 ? (
        <div className="transition-opacity duration-300 ease-in-out">
          <div className={`grid ${gridCols} gap-4 md:gap-6`}> {/* Use the gridCols variable */}
            {displayItems.map((media, index) => (
              <div key={`${media.id}-${index}`} className="hover-lift">
                <MemoizedMediaPoster media={media} />
              </div>
            ))}
          </div>
          
          {hasMoreItems && (
            <div 
              ref={loaderRef} 
              className="flex justify-center items-center py-8 mt-4"
              id={`scroll-loader-${mediaType}`}
            >
              {isLoadingMore ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-6 h-6 animate-spin text-pink mb-2" />
                  <p className="text-sm text-muted-foreground">Loading more...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <button 
                    onClick={loadMoreItems}
                    className="flex flex-col items-center hover:text-pink transition-colors cursor-pointer"
                  >
                    <Clock className="w-5 h-5 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Scroll or click for more</p>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <EmptyState 
          mediaType={mediaType} 
          searchQuery={searchQuery} 
          onClearSearch={handleClearSearch} 
        />
      )}
    </div>
  );
}

// Simplified EmptyState component
const EmptyState: React.FC<EmptyStateProps> = ({ mediaType, searchQuery, onClearSearch }) => (
  <div className="frosted-panel text-center py-12 transition-opacity duration-300 ease-in-out">
    <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-pink/10">
      {searchQuery ? (
        <Search className="w-6 h-6 text-pink/50" />
      ) : (
        <AlertTriangle className="w-6 h-6 text-pink/50" />
      )}
    </div>
    <h3 className="text-xl font-medium mb-2">
      {searchQuery ? `No results found for "${searchQuery}"` : `No items in your watchlist`}
    </h3>
    <p className="text-foreground/60 mb-6 max-w-md mx-auto">
      {searchQuery 
        ? 'Try adjusting your search or clear the filter to see all items.'
        : `Start adding ${mediaType === 'movie' ? 'movies' : 'TV shows'} to keep track of what you want to watch`}
    </p>
    {searchQuery ? (
      <button onClick={onClearSearch} className="button-neutral">
        Clear Search
      </button>
    ) : (
      <button className="button-primary">
        Browse {mediaType === 'movie' ? 'Movies' : 'Shows'}
      </button>
    )}
  </div>
);
