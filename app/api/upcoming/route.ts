// app/api/upcoming/route.ts
import { NextResponse } from 'next/server';

// Define interface for movie data from TMDB API
interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  popularity: number;
  [key: string]: any; // For other properties that might be present
}

const TMDB_API_KEY = process.env.NEXT_PRIVATE_TMDB_API_KEY;

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  const sortBy = searchParams.get('sort_by') || 'release_date.asc';
  
  // Base URL for upcoming movies
  const url = `https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=${page}&region=US`;

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from TMDB: ${response.status}`);
    }

    const data = await response.json();

    // Filter out movies with release dates in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to beginning of the day for comparison

    const upcomingMovies = data.results.filter((movie: TMDBMovie) => {
      if (!movie.release_date) return false; // Exclude movies without a release date
      const releaseDate = new Date(movie.release_date);
      releaseDate.setHours(0, 0, 0, 0); // Also set time to beginning of the day
      return releaseDate >= today;
    });
    
    // Sort the filtered results
    if (sortBy === 'release_date.asc') {
      upcomingMovies.sort((a: TMDBMovie, b: TMDBMovie) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
    } else if (sortBy === 'release_date.desc') {
      upcomingMovies.sort((a: TMDBMovie, b: TMDBMovie) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    } else if (sortBy === 'popularity.desc') {
      // Note: Popularity sorting might be less relevant after filtering for future dates
      upcomingMovies.sort((a: TMDBMovie, b: TMDBMovie) => b.popularity - a.popularity);
    }

    // Return the filtered and sorted data
    // Preserve the original pagination structure if needed by the frontend hook
    return NextResponse.json({ 
      ...data, // Keep original page, total_pages etc.
      results: upcomingMovies // Replace results with the filtered list
    });
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
