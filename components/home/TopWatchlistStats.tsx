// components/home/TopWatchlistStats.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useTopWatchlist } from '@/context/TopWatchlistContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Users, Loader2, Heart, ArrowRight } from 'lucide-react';
import { TopWatchlistItem } from '@/types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import MediaTypeToggle from '../MediaTypeToggle';

export function TopWatchlistStats() {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const { topWatchlistItems, isLoading, error } = useTopWatchlist();
  const [initialLoad, setInitialLoad] = useState(true);

  const items = topWatchlistItems[mediaType].slice(0, 5);

  useEffect(() => {
    if (!isLoading) {
      setInitialLoad(false);
    }
  }, [isLoading]);

  if (initialLoad) {
    return (
      <div className="frosted-panel flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="frosted-panel p-6 rounded-2xl">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="frosted-panel p-6 rounded-2xl flex flex-col h-full">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-medium tracking-tight">Most Watchlisted</h2>
            <p className="text-sm text-foreground/60">Popular among friends</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="apple-icon-button">
                <Users className="w-5 h-5 text-primary" />
              </TooltipTrigger>
              <TooltipContent className="frosted-glass">
                <p>Most watchlisted by you and your friends</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Toggle */}
        <div className="flex justify-center">
          <MediaTypeToggle 
            mediaType={mediaType} 
            onMediaTypeChange={(type) => setMediaType(type)} 
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mediaType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3 flex-grow py-4"
        >
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto mb-3 text-foreground/30" />
              <p className="text-foreground/50">No items watchlisted yet</p>
            </div>
          ) : (
            items.map((item, index) => (
              <WatchlistStatItem
                key={item.id}
                item={item}
                rank={index + 1}
                mediaType={mediaType}
              />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer - Conditionally rendered */}
      {items.length > 0 && (
        <Link href="/top-watchlist" className="block mt-2">
          <button
            className="apple-button w-full group flex items-center justify-center"
          >
            <span className="flex items-center justify-center">
              View All Rankings
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </Link>
      )}
    </div>
  );
}

const WatchlistStatItem = ({
  item,
  rank,
  mediaType
}: {
  item: TopWatchlistItem;
  rank: number;
  mediaType: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/details/${mediaType}/${item.id}`}>
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ x: 4 }}
        className={cn(
          "flex items-center space-x-4 p-3 rounded-2xl",
          "transition-all duration-300",
          "hover:bg-white/10 dark:hover:bg-black/20 hover-lift"
        )}
      >
        {/* Rank */}
        <span className={cn(
          "text-2xl font-bold w-8 text-center",
          "transition-colors duration-300",
          isHovered ? "text-primary" : "text-primary/40"
        )}>
          {rank}
        </span>

        {/* Poster */}
        <div className="relative w-12 h-16 rounded-xl overflow-hidden shadow-md">
          <Image
            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
            alt={item.title || item.name || ''}
            fill
            sizes="96px"
            className={cn(
              "object-cover",
              "transition-all duration-300",
              isHovered && "scale-105"
            )}
          />
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <h3 className="font-medium text-sm line-clamp-1">
            {item.title || item.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1 text-xs text-foreground/60">
            <span className="flex items-center">
              <Heart className={cn(
                "w-3 h-3 mr-1",
                "transition-colors duration-300",
                isHovered ? "text-primary fill-primary" : "text-primary/70"
              )} />
              {item.watchlist_count} friends
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Star className="w-3 h-3 mr-1 text-yellow-400 fill-yellow-400" />
              {item.vote_average?.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Arrow indicator on hover */}
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -5 }}
          transition={{ duration: 0.2 }}
          className="text-primary"
        >
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </Link>
  );
};
