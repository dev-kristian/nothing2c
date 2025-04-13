"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { useFriendsWatchlist } from '@/context/FriendsWatchlistContext';
import { Users, Heart, Popcorn, TrendingUp, Film, Tv } from 'lucide-react';
import Link from 'next/link';
import MediaTypeToggle from '@/components/MediaTypeToggle';
import MediaPoster from '@/components/MediaPoster';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; 
import useSWR from 'swr';
import { Skeleton } from '@/components/ui/skeleton';

const MemoizedMediaPoster = React.memo(MediaPoster);

interface Genre {
  id: number;
  name: string;
}

interface GenreWithCount extends Genre {
  count: number;
}

function GenreStats({ mediaType }: { mediaType: 'movie' | 'tv' }) {
  const { data: genreData } = useSWR<{ genres: Genre[] }>(`/api/genres?type=${mediaType}`);
  const { friendsWatchlistItems } = useFriendsWatchlist();

  const genreStats = useMemo(() => {
    if (!genreData?.genres || !friendsWatchlistItems[mediaType]) return [];
    
    const stats = genreData.genres.map((genre: Genre) => {
      const count = friendsWatchlistItems[mediaType].filter(item => 
        item.genre_ids?.includes(genre.id)
      ).length;
      return { ...genre, count };
    });

    return stats.sort((a: GenreWithCount, b: GenreWithCount) => b.count - a.count).slice(0, 5);
  }, [genreData, friendsWatchlistItems, mediaType]);

  
  if (!genreData?.genres) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-pink" />
          <h3 className="text-lg font-semibold">Top Community Genres</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {genreStats.map((genre) => (
          <div key={genre.id} className="flex items-center justify-between">
            <span className="text-sm text-foreground/80">{genre.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{genre.count}</span>
              <Heart className="w-3 h-3 text-pink" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


const CommunitySkeleton = () => {
  const gridCols = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 md:gap-4"; 
  const posterCount = 6; 

  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
      </div>

      {/* Stats Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stat Card 1 Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={`stat1-skel-${i}`} className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Stat Card 2 Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Friends Watchlist Grid Skeleton */}
      <div className={`grid ${gridCols} gap-4 md:gap-6`}>
        {Array.from({ length: posterCount }).map((_, index) => (
          <div key={`poster-skel-${index}`} className="space-y-2">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
};

export function CommunitySection() {
  const { friendsWatchlistItems, isLoading } = useFriendsWatchlist();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [visibleItems, setVisibleItems] = useState(12);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  
  const gridCols = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4";

  const items = friendsWatchlistItems[mediaType].slice(0, visibleItems);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && friendsWatchlistItems[mediaType].length > visibleItems) {
          setVisibleItems((prev) => prev + 12);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [friendsWatchlistItems, mediaType, visibleItems]);

  
  useEffect(() => {
    setVisibleItems(12);
  }, [mediaType]);

  if (isLoading) {
    return <CommunitySkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Community Center</h2>
          <p className="text-sm text-foreground/60">
            Discover what your friends are watching
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MediaTypeToggle
            mediaType={mediaType}
            onMediaTypeChange={(newType) => {
              if (newType === 'movie' || newType === 'tv') {
                setMediaType(newType);
              }
              
            }}
          />
        </div>
      </div>

      {/* Main content area: Stats first, then posters */}
      <div className="grid grid-cols-1 gap-6">
        {/* Community Stats Section - Responsive Grid for Stat Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* Default: 1 col, lg: 2 cols */}
          {/* Stat Card 1: Top Genres */}
          <GenreStats mediaType={mediaType} />
          
          {/* Stat Card 2: General Stats */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Popcorn className="w-5 h-5 text-pink" />
              <h3 className="text-lg font-semibold">Community Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-foreground/60" />
                <div>
                  <div className="text-sm font-medium">
                    {friendsWatchlistItems.movie.length}
                  </div>
                  <div className="text-xs text-foreground/60">Movies</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-foreground/60" />
                <div>
                  <div className="text-sm font-medium">
                    {friendsWatchlistItems.tv.length}
                  </div>
                  <div className="text-xs text-foreground/60">TV Shows</div>
                </div>
              </div>
            </div>
          </Card>
        </div> {/* End of responsive grid for stat cards */}

        {/* Friends Watchlist Section */}
        <div className="space-y-6">
          {items.length > 0 ? (
            <div className="transition-opacity duration-300 ease-in-out space-y-6">
              <div className={`grid ${gridCols} gap-4 md:gap-6 min-h-[200px]`}> {/* Use the gridCols variable */}
                {items.map((media, index) => (
                  <div key={`${media.id}-${index}`} className="hover-lift relative">
                    <MemoizedMediaPoster media={media} />
                    <div className="absolute top-2 left-2 flex items-center space-x-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                      <Heart className="w-3 h-3 text-pink" />
                      <span className="text-xs font-medium text-white">{media.watchlist_count}</span>
                    </div>
                  </div>
                ))}
              </div>
              {visibleItems < friendsWatchlistItems[mediaType].length && (
                <div 
                  ref={loadMoreRef} 
                  className="w-full py-4 flex justify-center"
                >
                  <div className="w-6 h-6 border-2 border-pink/20 border-t-pink rounded-full animate-spin" />
                </div>
              )}
            </div>
          ) : (
            <div className="frosted-panel text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-pink/10">
                <Users className="w-6 h-6 text-pink/50" />
              </div>
              <h3 className="text-xl font-medium mb-2">No community favorites yet</h3>
              <p className="text-foreground/60 mb-6 max-w-md mx-auto">
                As you and your friends add more items to their watchlists, they will appear here
              </p>
              <Link href="/friends">
                <button className="button-primary">
                  Find Friends
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
