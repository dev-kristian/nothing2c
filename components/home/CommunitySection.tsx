"use client"

import React, { useState, useMemo, useEffect } from 'react';
import { useFriendsWatchlist } from '@/context/FriendsWatchlistContext';
import { useScreenSize } from '@/context/ScreenSizeContext';
import { Users, Heart, Popcorn, TrendingUp, Film, Tv } from 'lucide-react';
import Link from 'next/link';
import MediaTypeToggle from '@/components/MediaTypeToggle';
import MediaPoster from '@/components/MediaPoster';
import { Card } from '@/components/ui/card';
import useSWR from 'swr';

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

  if (!genreData?.genres) return null;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-pink" />
        <h3 className="text-lg font-semibold">Top Community Genres</h3>
      </div>
      <div className="space-y-3">
        {genreStats.map((genre) => (
          <div key={genre.id} className="flex items-center justify-between">
            <span className="text-sm text-foreground/80">{genre.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{genre.count}</span>
              <Heart className="w-3 h-3 text-pink" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CommunitySection() {
  const { friendsWatchlistItems, isLoading } = useFriendsWatchlist();
  const { isMobile, isTablet } = useScreenSize();
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [visibleItems, setVisibleItems] = useState(12);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const gridCols = useMemo(() => {
    return isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-3';
  }, [isMobile, isTablet]);

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

  // Reset visible items when media type changes
  useEffect(() => {
    setVisibleItems(12);
  }, [mediaType]);

  if (isLoading) {
    return (
      <div className="frosted-panel flex justify-center items-center py-12">
        <div className="w-6 h-6 border-2 border-pink/20 border-t-pink rounded-full animate-spin" />
      </div>
    );
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
            onMediaTypeChange={setMediaType}
            compact={true} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        {/* Friends Watchlist Section */}
        <div className="space-y-6">
          {items.length > 0 ? (
            <div className="transition-opacity duration-300 ease-in-out space-y-6">
              <div className={`grid ${gridCols} gap-4 md:gap-6 min-h-[200px]`}>
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

        {/* Community Stats Section */}
        <div className="space-y-6">
          <GenreStats mediaType={mediaType} />
          
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
        </div>
      </div>
    </div>
  );
}
