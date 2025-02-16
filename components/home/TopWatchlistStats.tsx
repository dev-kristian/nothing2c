// components/home/TopWatchlistStats.tsx
'use client'

import React, { useState, useEffect } from 'react'; // Import useEffect
import { useTopWatchlist } from '@/context/TopWatchlistContext';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Users, Loader2, Heart, ArrowRight } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopWatchlistItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function TopWatchlistStats() {
  const [mediaType, setMediaType] = React.useState<'movie' | 'tv'>('movie');
  const { topWatchlistItems, isLoading, error } = useTopWatchlist();
  const [initialLoad, setInitialLoad] = useState(true); // Track initial load

  const items = topWatchlistItems[mediaType].slice(0, 5);

  // Added useEffect to handle the isInitialLoad
  useEffect(() => {
    if (!isLoading) {
      setInitialLoad(false);
    }
  }, [isLoading]);

  if (initialLoad) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-500/10 rounded-xl">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Most Watchlisted</h2>
          <p className="text-sm text-gray-400">Popular among friends</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Users className="w-5 h-5 text-primary" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Most watchlisted by you and your friends</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Tabs */}
      <Tabs
        value={mediaType}
        onValueChange={(v) => setMediaType(v as 'movie' | 'tv')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-white/5">
          <TabsTrigger value="movie">Movies</TabsTrigger>
          <TabsTrigger value="tv">TV Shows</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mediaType}  // Add a key based on mediaType for AnimatePresence
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }} // Add transition for smoother changes
          className="space-y-3"
        >
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-400">No items watchlisted yet</p>
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

      {/* Footer */}
      <Link href="/top-watchlist" className="block">
        <Button
          variant="ghost"
          className="w-full group bg-white/5 hover:bg-white/10 text-primary"
        >
          <span className="flex items-center justify-center">
            View All Rankings
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </span>
        </Button>
      </Link>
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
          "flex items-center space-x-4 p-2 rounded-xl",
          "transition-colors duration-200",
          "hover:bg-white/5"
        )}
      >
        {/* Rank */}
        <span className={cn(
          "text-2xl font-bold w-8",
          "transition-colors duration-200",
          isHovered ? "text-primary" : "text-primary/50"
        )}>
          {rank}
        </span>
        
        {/* Poster */}
        <div className="relative w-12 h-16 rounded-lg overflow-hidden">
        <Image
          src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
          alt={item.title || item.name || ''}
          fill
          sizes="96px"
          className={cn(
            "object-cover",
            "transition-transform duration-200",
            isHovered && "scale-105"
          )}
        />
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
          <h3 className="font-medium text-sm line-clamp-1">
            {item.title || item.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400">
            <span className="flex items-center">
              <Heart className={cn(
                "w-3 h-3 mr-1",
                "transition-colors duration-200",
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
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="text-primary"
        >
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </Link>
  );
};
