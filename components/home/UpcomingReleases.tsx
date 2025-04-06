// components/home/UpcomingReleases.tsx
"use client"

import React, { useRef, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Star, Filter, ChevronDown } from 'lucide-react';
import { useUpcomingMovies } from '@/hooks/home/useUpcomingMovies';

export function UpcomingReleases() {
  const [sortBy, setSortBy] = useState<'release_date.asc' | 'release_date.desc' | 'popularity.desc'>('release_date.asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { movies, loading, error, hasMore, loadMore, refetch } = useUpcomingMovies(sortBy);
  
  const formatReleaseDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const daysUntilRelease = (dateString: string) => {
    const releaseDate = new Date(dateString);
    const today = new Date();

    releaseDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const differenceInTime = releaseDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays === 0) return "Today";
    if (differenceInDays === 1) return "Tomorrow";
    if (differenceInDays < 0) return "Released";
    return `${differenceInDays} days`;
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    refetch(newSortBy);
    setIsFilterOpen(false);
  };

  const observer = useRef<IntersectionObserver | null>(null);
  const lastMovieElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMore]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Upcoming Movies</h2>
          <p className="text-sm text-foreground/60">
            Mark your calendar for these new releases
          </p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 bg-white/20 dark:bg-black/20 hover:bg-white/30 dark:hover:bg-black/30 px-4 py-2 rounded-full text-sm transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Sort by</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isFilterOpen && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-md shadow-lg frosted-panel ring-1 ring-black ring-opacity-5 z-10"
            >
              <div className="py-1">
                <button
                  className={`block px-4 py-2 text-sm w-full text-left ${sortBy === 'release_date.asc' ? 'bg-pink/10 text-pink' : 'hover:bg-gray-4 dark:hover:bg-gray-3-dark'}`}
                  onClick={() => handleSortChange('release_date.asc')}
                >
                  Soonest release first
                </button>
                <button
                  className={`block px-4 py-2 text-sm w-full text-left ${sortBy === 'release_date.desc' ? 'bg-pink/10 text-pink' : 'hover:bg-gray-4 dark:hover:bg-gray-3-dark'}`}
                  onClick={() => handleSortChange('release_date.desc')}
                >
                  Latest release first
                </button>
                <button
                  className={`block px-4 py-2 text-sm w-full text-left ${sortBy === 'popularity.desc' ? 'bg-pink/10 text-pink' : 'hover:bg-gray-4 dark:hover:bg-gray-3-dark'}`}
                  onClick={() => handleSortChange('popularity.desc')}
                >
                  Most popular
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              ref={index === movies.length - 1 ? lastMovieElementRef : null}
              className="frosted-panel overflow-hidden rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <Link href={`/details/movie/${movie.id}`}>
                <div className="relative h-48 w-full">
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title || ''}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 bg-pink/90 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    {daysUntilRelease(movie.release_date || '')}
                  </div>
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-lg line-clamp-1">{movie.title}</h3>
                    <p className="text-white/80 text-sm">
                      {formatReleaseDate(movie.release_date || '')}
                    </p>
                  </div>
                </div>
              </Link>
              
              <div className="p-4">
                <p className="text-sm text-foreground/80 line-clamp-2 mb-4">{movie.overview}</p>
                
                <div className="flex items-center justify-between">
                  {movie.vote_average > 0 ? (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1.5" />
                      <span className="text-sm font-medium">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-foreground/60">No ratings yet</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading && !error ? (
        <div className="text-center py-12">
          <p className="text-lg text-foreground/60">No upcoming movies found</p>
        </div>
      ) : null}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink"></div>
            <p className="mt-4 text-sm text-foreground/60">Loading more movies...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-6 px-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-red-600 dark:text-red-400">
            Error: {error}
          </p>
          <button 
            onClick={() => refetch(sortBy)}
            className="mt-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
