// components/home/WatchlistOverview.tsx
'use client'

import React, { useState } from 'react';
import { useUserData } from '@/context/UserDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, Search, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Media } from '@/types';
import { useCustomToast } from '@/hooks/useToast';

export function WatchlistOverview() {
  const { watchlistItems } = useUserData();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Filtering logic
  const filteredItems = watchlistItems[mediaType]
    .filter(item =>
      (item.title || item.name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    )
    .slice(0, 6);

  return (
    <div className="space-y-8 frosted-panel p-6 rounded-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-2xl font-medium tracking-tight">Your Watchlist</h2>
          <p className="text-sm text-foreground/60">
            {watchlistItems[mediaType].length} items saved
          </p>
        </motion.div>

        <motion.div 
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative w-full sm:w-64">
            <div className={`
              frosted-glass rounded-full overflow-hidden transition-all duration-300
              ${isFocused ? 'ring-2 ring-primary/50 shadow-lg' : ''}
            `}>
              <div className="flex items-center pl-4">
                <Search className={`h-4 w-4 mr-2 transition-colors duration-300 ${isFocused ? 'text-primary' : 'text-foreground/50'}`} />
                <input
                  placeholder="Search watchlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full bg-transparent text-foreground placeholder-foreground/50 border-none 
                            py-2.5 pr-4 focus:outline-none focus:ring-0"
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setSearchQuery('')}
                      className="p-2 text-foreground/50 hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="frosted-glass rounded-full p-0.5 inline-flex w-full sm:w-auto">
            <div className="relative z-0 flex">
              <motion.div 
                className="absolute inset-0 z-0 bg-primary/20 dark:bg-primary/30 rounded-full shadow-sm"
                initial={false}
                animate={{
                  x: mediaType === 'movie' ? 0 : '100%',
                  width: '50%'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setMediaType('movie')}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  mediaType === 'movie'
                    ? 'text-primary dark:text-primary-foreground'
                    : 'text-foreground/60 dark:text-foreground/60 hover:text-foreground dark:hover:text-foreground'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setMediaType('tv')}
                className={`relative z-10 px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  mediaType === 'tv'
                    ? 'text-primary dark:text-primary-foreground'
                    : 'text-foreground/60 dark:text-foreground/60 hover:text-foreground dark:hover:text-foreground'
                }`}
              >
                TV Shows
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {filteredItems.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6"
          >
            {filteredItems.map((item, index) => (
              <WatchlistCard 
                key={item.id} 
                item={item} 
                mediaType={mediaType} 
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState mediaType={mediaType} />
        )}
      </AnimatePresence>

      {watchlistItems[mediaType].length > 6 && (
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/watchlist">
            <button className="frosted-glass px-6 py-2.5 rounded-full inline-flex items-center space-x-2 hover-lift">
              <span className="text-foreground/80">View All ({watchlistItems[mediaType].length})</span>
              <ChevronRight className="h-4 w-4 text-primary" />
            </button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}

const WatchlistCard = ({ 
  item, 
  mediaType, 
  index 
}: { 
  item: Media; 
  mediaType: string;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { removeFromWatchlist } = useUserData();
  const { showToast } = useCustomToast();

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromWatchlist(item.id, mediaType as 'movie' | 'tv');
    showToast(
      "Removed from watchlist",
      `${item.title || item.name} has been removed.`,
      "success"
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.22, 1, 0.36, 1],
        delay: index * 0.05 // Staggered animation
      }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/details/${mediaType}/${item.id}`}>
        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-md hover-lift">
          <Image
            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
            alt={item.title || item.name || ''}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
            className={cn(
              "object-cover transition-all duration-500",
              isHovered && "scale-105 brightness-75"
            )}
            priority
          />
          
          {/* Glass overlay on hover */}
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300",
              isHovered && "opacity-100"
            )}
          />
          
          {/* Remove button */}
          <motion.button
            onClick={handleRemove}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-2 right-2 p-2 bg-white/10 backdrop-blur-md rounded-full 
              border border-white/20 text-white hover:bg-red-500/80 z-10"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 p-4 flex flex-col justify-end"
              >
                <div className="space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2 text-white">
                    {item.title || item.name}
                  </h3>

                  <div className="flex items-center space-x-2 text-xs text-white/90">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                    <span>{item.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    </motion.div>
  );
};

const EmptyState = ({ mediaType }: { mediaType: string }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="text-center px-8"
  >
    <Heart className="w-12 h-12 mx-auto mb-6 text-primary/50" />
    <h3 className="text-xl font-medium mb-3">No items in your watchlist</h3>
    <p className="text-foreground/60 mb-6 max-w-md mx-auto">
      Start adding {mediaType === 'movie' ? 'movies' : 'TV shows'} to keep track of what you want to watch
    </p>
    <Link href={`/explore`}>
      <button className="apple-button">
        Browse {mediaType === 'movie' ? 'Movies' : 'Shows'}
      </button>
    </Link>
  </motion.div>
);
