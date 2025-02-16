'use client'

import React, { useState, useEffect } from 'react';
import { useTopWatchlist } from '@/context/TopWatchlistContext';
import { TopWatchlistItem } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Users, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function TopWatchlistPage() {
  const { topWatchlistItems, isLoading, error } = useTopWatchlist();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items: TopWatchlistItem[] = topWatchlistItems[mediaType];

  if (!mounted) return null;

  return (
    <div className="container mx-auto px-4 pt-16">
      <h1 className="text-4xl font-extrabold mb-2 text-center">Top Watchlist</h1>
      <Tabs value={mediaType} onValueChange={(value) => setMediaType(value as 'movie' | 'tv')} className="mb-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
        <TabsTrigger value="movie" className="text-sm">Movies</TabsTrigger>
        <TabsTrigger value="tv" className="text-sm">TV Shows</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-4 bg-red-100 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={mediaType}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {items.map((item: TopWatchlistItem, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
                  <Link href={`/details/${mediaType}/${item.id}`}>
                    <div className="relative aspect-[2/3] w-full">
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${item.poster_path}`}
                        alt={item.title || item.name || ''}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                        className="transition-transform duration-300 hover:scale-105"
                        priority
                      />
                      <Badge className="absolute top-2 right-2 bg-primary/80">
                        #{index + 1}
                      </Badge>
                    </div>
                    <CardContent className="p-2 sm:p-3">
                      <h3 className="font-bold text-sm sm:text-base mb-1 line-clamp-1">{item.title || item.name}</h3>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="flex items-center text-gray-400">
                          <Users size={12} className="mr-1" />
                          {item.watchlist_count || 'N/A'}
                        </span>
                        <span className="flex items-center text-yellow-400">
                          <Star size={12} className="mr-1" />
                          {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}