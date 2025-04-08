// app/api/search/route.ts
import { NextResponse } from 'next/server'

interface MediaItem {
  id: number;
  title?: string; 
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  popularity: number;
}

interface PersonItem {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department: string;
  popularity: number;
}

type TmdbResultItem = MediaItem | PersonItem;

type SearchResultItem = (MediaItem | PersonItem) & { media_type: 'movie' | 'tv' | 'person' };

interface TmdbApiResponse<T extends TmdbResultItem> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

interface FinalApiResponse {
  page: number;
  results: SearchResultItem[];
  total_pages: number;
  total_results: number;
}

const TMDB_API_KEY = process.env.NEXT_PRIVATE_TMDB_API_KEY

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const type = searchParams.get('type') || 'multi'
  const year = searchParams.get('year')
  const genre = searchParams.get('genre')
  const sortBy = searchParams.get('sort_by') || 'popularity.desc'
  const includeAdult = searchParams.get('include_adult') === 'true'
  const page = searchParams.get('page') || '1'

  let url: string | undefined; 

  if (query || type !== 'multi') {
    if (query) {
      url = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(query)}&include_adult=${includeAdult}&language=en-US&page=${page}`

      if (year && type !== 'person' && (type === 'movie' || type === 'tv')) {
        const yearParam = type === 'movie' ? 'primary_release_year' : 'first_air_date_year'
        url += `&${yearParam}=${year}`
      }
    } else {
      const discoverType = type; 
      url = `https://api.themoviedb.org/3/discover/${discoverType}?include_adult=${includeAdult}&language=en-US&page=${page}&sort_by=${sortBy}`

      if (year && type !== 'person') {
        const yearParam = type === 'tv' ? 'first_air_date_year' : 'primary_release_year'
        url += `&${yearParam}=${year}`
      }

      if (genre && type !== 'person') {
        url += `&with_genres=${genre}`
      }
    }
  }

  try {
    let finalData: FinalApiResponse;

    if (!query && type === 'multi') {

      const movieDiscoverUrl = `https://api.themoviedb.org/3/discover/movie?include_adult=${includeAdult}&language=en-US&page=${page}&sort_by=${sortBy}${year ? `&primary_release_year=${year}` : ''}${genre ? `&with_genres=${genre}` : ''}`;
      const tvDiscoverUrl = `https://api.themoviedb.org/3/discover/tv?include_adult=${includeAdult}&language=en-US&page=${page}&sort_by=${sortBy}${year ? `&first_air_date_year=${year}` : ''}${genre ? `&with_genres=${genre}` : ''}`;

      const [movieResponse, tvResponse] = await Promise.all([
        fetch(movieDiscoverUrl, { headers: { 'Authorization': `Bearer ${TMDB_API_KEY}`, 'accept': 'application/json' } }),
        fetch(tvDiscoverUrl, { headers: { 'Authorization': `Bearer ${TMDB_API_KEY}`, 'accept': 'application/json' } })
      ]);

      if (!movieResponse.ok && !tvResponse.ok) {
        console.error(`TMDB Multi-Discover Error: Movie=${movieResponse.status}, TV=${tvResponse.status}`);
        throw new Error(`Failed to fetch multi-discover data from TMDB (Movie: ${movieResponse.status}, TV: ${tvResponse.status})`);
      }

      const movieData: TmdbApiResponse<MediaItem> = movieResponse.ok ? await movieResponse.json() : { page: 1, results: [], total_pages: 0, total_results: 0 };
      const tvData: TmdbApiResponse<MediaItem> = tvResponse.ok ? await tvResponse.json() : { page: 1, results: [], total_pages: 0, total_results: 0 };

      const movieResults: SearchResultItem[] = movieData.results.map((item: MediaItem) => ({ ...item, media_type: 'movie' }));
      const tvResults: SearchResultItem[] = tvData.results.map((item: MediaItem) => ({ ...item, media_type: 'tv' }));

      const combinedResults: SearchResultItem[] = [...movieResults, ...tvResults];

      combinedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      finalData = {
        page: parseInt(page),
        results: combinedResults,
        total_pages: Math.max(movieData.total_pages || 0, tvData.total_pages || 0),
        total_results: (movieData.total_results || 0) + (tvData.total_results || 0)
      };

    } else {
      if (!url) {
        throw new Error("Internal error: URL not constructed for single fetch.");
      }
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${TMDB_API_KEY}`,
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        console.error(`TMDB API Error (${url}): ${response.status} - ${errorDetails}`);
        throw new Error(`Failed to fetch data from TMDB: ${response.status} - ${response.statusText}`);
      }

      const fetchedData = await response.json();

      finalData = {
        page: fetchedData.page,
        results: [],
        total_pages: fetchedData.total_pages,
        total_results: fetchedData.total_results
      };

      if (fetchedData.results) {
        if (type === 'person') {
          finalData.results = fetchedData.results.map((item: PersonItem): SearchResultItem => ({ ...item, media_type: 'person' }));
        } else if (type === 'movie' || type === 'tv') {
          finalData.results = fetchedData.results.map((item: MediaItem): SearchResultItem => ({ ...item, media_type: type as 'movie' | 'tv' }));
        } else {
           finalData.results = fetchedData.results;
        }
      }
    }

    return NextResponse.json(finalData);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in search API route:', error.message);
      return NextResponse.json({ error: `Failed to fetch data: ${error.message}` }, { status: 500 });
    } else {
      console.error('Unknown error in search API route:', error);
      return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
    }
  }
}
