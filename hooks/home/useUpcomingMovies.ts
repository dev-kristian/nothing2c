// hooks/useUpcomingMovies.ts
import { useState, useEffect, useCallback } from 'react';
import { SearchResult } from '@/types/media';

interface UpcomingMoviesResponse {
  results: SearchResult[];
  page: number;
  total_pages: number;
}

export function useUpcomingMovies(sortBy: string = 'release_date.asc') {
  const [movies, setMovies] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMovies = useCallback(async (pageNum: number, sort: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/upcoming?page=${pageNum}&sort_by=${sort}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming movies');
      }
      
      const data: UpcomingMoviesResponse = await response.json();
      
      if (pageNum === 1) {
        setMovies(data.results);
      } else {
        setMovies(prev => [...prev, ...data.results]);
      }
      
      setHasMore(data.page < data.total_pages);
      setPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchMovies(page + 1, sortBy);
    }
  }, [loading, hasMore, page, fetchMovies, sortBy]);

  const refetch = useCallback((sort: string) => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
    fetchMovies(1, sort);
  }, [fetchMovies]);

  useEffect(() => {
    fetchMovies(1, sortBy);
  }, [fetchMovies, sortBy]);

  return { movies, loading, error, hasMore, loadMore, refetch };
}
