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
    
    // Sort results based on sortBy parameter
    if (sortBy === 'release_date.asc') {
      data.results.sort((a: TMDBMovie, b: TMDBMovie) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());
    } else if (sortBy === 'release_date.desc') {
      data.results.sort((a: TMDBMovie, b: TMDBMovie) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime());
    } else if (sortBy === 'popularity.desc') {
      data.results.sort((a: TMDBMovie, b: TMDBMovie) => b.popularity - a.popularity);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
