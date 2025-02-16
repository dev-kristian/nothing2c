// app/(root)/watchlist/page.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUserData } from '@/context/UserDataContext';
import { useScreenSize } from '@/context/ScreenSizeContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Clock, X, Loader2, AlertTriangle, ChevronDown, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useCustomToast } from '@/hooks/useToast';
import { shimmer, toBase64 } from '@/lib/image-shimmer';
import { useDebounce } from '@/hooks/useDebounce';

export default function WatchlistPage() {
  const { watchlistItems, removeFromWatchlist } = useUserData();
  const { isMobile, isTablet, isDesktop, is4K } = useScreenSize();
  const { showToast } = useCustomToast();
  
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'title'>('rating');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
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
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const getGridCols = () => {
    if (isMobile) return 'grid-cols-2';
    if (isTablet) return 'grid-cols-3';
    if (isDesktop) return 'grid-cols-6';
    if (is4K) return 'grid-cols-10';
    return 'grid-cols-4';
  };

  const getMaxWidth = () => {
    if (is4K) return 'max-w-[2000px]';
    if (isDesktop) return 'max-w-[1600px]';
    if (isTablet) return 'max-w-[1024px]';
    return 'max-w-full';
  };

  const getPadding = () => {
    if (isMobile) return 'px-2';
    if (isTablet) return 'px-4';
    return 'px-6';
  };

  const filteredAndSortedItems = React.useMemo(() => {
    let items = [...watchlistItems[mediaType]];

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
  }, [watchlistItems, mediaType, debouncedSearchQuery, sortBy]);

  const loadMoreItems = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleItems((prevVisibleItems) => {
        const increment = isMobile ? 4 : isTablet ? 6 : isDesktop ? 10 : 12;
        return prevVisibleItems + increment;
      });
      setIsLoadingMore(false);
    }, 500);
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

  const handleRemove = async (id: number, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromWatchlist(id, mediaType);
    showToast("Removed from watchlist", `${title} has been removed.`, "success");
  };

  const displayedItems = filteredAndSortedItems.slice(0, visibleItems);

  const sortLabel = () => {
    switch (sortBy) {
      case 'date': return 'Latest First';
      case 'rating': return 'Top Rated';
      case 'title': return 'A-Z';
      default: return 'Sort By';
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className={`${getMaxWidth()} mx-auto ${getPadding()} py-4`}>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-extrabold mb-4"
        >
          My Watchlist
        </motion.h1>
        
        <div >
          <div className="flex flex-col lg:flex-row gap-6 items-center pb-4">
            {/* Media Type Selector */}
            <div className="bg-white/5 backdrop-blur-2xl rounded-full p-1 flex-shrink-0 relative">
              <div className="flex gap-2 relative">
                {/* Animated Background */}
                <motion.div
                  className="absolute inset-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  animate={{
                    x: mediaType === 'movie' ? 0 : '100%',
                    width: '50%'
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                  layout
                />
                
                {/* Buttons */}
                {['movie', 'tv'].map((type) => (
                  <motion.button
                    key={type}
                    onClick={() => {
                      setMediaType(type as 'movie' | 'tv');
                      setSearchQuery('');
                      setVisibleItems(getInitialVisibleItems());
                    }}
                    className={`
                      px-8 py-3 rounded-full text-sm font-medium transition-all duration-300
                      relative z-10 ${mediaType === type ? 'text-white' : 'text-white/70'}
                    `}
                    whileHover={mediaType !== type ? { 
                      backgroundColor: "rgba(255, 255, 255, 0.1)" 
                    } : {}}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      animate={{
                        scale: mediaType === type ? 1.05 : 1
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }}
                    >
                      {type === 'movie' ? 'Movies' : 'TV Shows'}
                    </motion.span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex-1 flex gap-4 w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search your watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-2xl text-white px-6 py-4 rounded-full 
                    focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all
                    placeholder:text-white/40"
                />
                <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-white/40" />
              </div>

              <div className="relative z-10" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="h-full bg-white/5 backdrop-blur-2xl text-white px-6 rounded-full 
                    flex items-center gap-2 hover:bg-white/10 transition-all"
                >
                  {sortLabel()}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-2xl rounded-2xl 
                        overflow-hidden border border-white/20 shadow-xl"
                    >
                      {['Top Rated','Latest First','A-Z'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSortBy(option === 'Latest First' ? 'date' : option === 'Top Rated' ? 'rating' : 'title');
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full text-left px-6 py-3 text-white hover:bg-white/20 transition-all"
                        >
                          {option}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredAndSortedItems.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <AlertTriangle className="w-20 h-20 text-pink-500 mx-auto mb-6" />
            <p className="text-white/80 text-2xl font-medium">
              {searchQuery
                ? `No results found for "${searchQuery}"`
                : `Your ${mediaType === 'movie' ? 'movie' : 'TV show'} watchlist is empty.`}
            </p>
          </motion.div>
        )}

        {/* Grid Layout */}
        <AnimatePresence>
          <div className={`grid ${getGridCols()} gap-8`}>
            {displayedItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group relative"
              >
                <Link href={`/details/${mediaType}/${item.id}`}>
                  <div className="relative aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-500 group-hover:scale-105">
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title || item.name || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      placeholder="blur"
                      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(500, 750))}`}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    <button
                      onClick={(e) => handleRemove(item.id, item.title || item.name || '', e)}
                      className="absolute top-4 right-4 p-2 bg-red-500/80 rounded-full 
                        opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-600"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-bold text-white text-lg line-clamp-2 mb-2 drop-shadow-md">
                        {item.title || item.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-white">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold drop-shadow-md">{item.vote_average?.toFixed(1)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span className="drop-shadow-md">
                            {format(new Date(item.release_date || item.first_air_date || 0), 'yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Load More */}
        {filteredAndSortedItems.length > visibleItems && (
          <div ref={loaderRef} className="text-center mt-12">
            {isLoadingMore ? (
              <Loader2 className="animate-spin w-10 h-10 text-purple-500 mx-auto" />
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium"
                onClick={loadMoreItems}
              >
                Load More
              </motion.button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}