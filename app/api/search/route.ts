// app/api/search/route.ts
import { NextResponse } from 'next/server'
import { buildTmdbUrl } from '@/lib/tmdb';

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

function getTmdbHeaders() {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB bearer token is not configured.');
  }

  return {
    Authorization: `Bearer ${TMDB_API_KEY}`,
    accept: 'application/json',
  };
}

async function tmdbRequest<T extends TmdbResultItem>(path: string, params: Record<string, string | number | boolean | undefined>) {
  const response = await fetch(buildTmdbUrl(path, params), {
    headers: getTmdbHeaders(),
  });

  if (!response.ok) {
    const errorDetails = await response.text();
    throw new Error(`TMDB request failed (${path}): ${response.status} ${errorDetails}`);
  }

  return response.json() as Promise<TmdbApiResponse<T>>;
}

function attachMediaType(results: MediaItem[], mediaType: 'movie' | 'tv'): SearchResultItem[] {
  return results.map((item) => ({ ...item, media_type: mediaType }));
}

function attachPersonType(results: PersonItem[]): SearchResultItem[] {
  return results.map((item) => ({ ...item, media_type: 'person' }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const type = searchParams.get('type') || 'multi'
  const year = searchParams.get('year')
  const genre = searchParams.get('genre')
  const sortBy = searchParams.get('sort_by') || 'popularity.desc'
  const includeAdult = searchParams.get('include_adult') === 'true'
  const page = searchParams.get('page') || '1'

  try {
    let finalData: FinalApiResponse;

    if (!query && type === 'multi') {
      const [movieData, tvData] = await Promise.all([
        tmdbRequest<MediaItem>('/discover/movie', {
          include_adult: includeAdult,
          language: 'en-US',
          page,
          sort_by: sortBy,
          primary_release_year: year || undefined,
          with_genres: genre || undefined,
        }),
        tmdbRequest<MediaItem>('/discover/tv', {
          include_adult: includeAdult,
          language: 'en-US',
          page,
          sort_by: sortBy,
          first_air_date_year: year || undefined,
          with_genres: genre || undefined,
        }),
      ]);

      const combinedResults: SearchResultItem[] = [
        ...attachMediaType(movieData.results, 'movie'),
        ...attachMediaType(tvData.results, 'tv'),
      ];

      combinedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      finalData = {
        page: parseInt(page),
        results: combinedResults,
        total_pages: Math.max(movieData.total_pages || 0, tvData.total_pages || 0),
        total_results: (movieData.total_results || 0) + (tvData.total_results || 0)
      };

    } else {
      const isSearchRequest = Boolean(query);
      const path = isSearchRequest ? `/search/${type}` : `/discover/${type}`;
      const fetchedData = await tmdbRequest<TmdbResultItem>(path, {
        query: query || undefined,
        include_adult: includeAdult,
        language: 'en-US',
        page,
        sort_by: isSearchRequest ? undefined : sortBy,
        primary_release_year: !isSearchRequest && type === 'movie' ? year || undefined : undefined,
        first_air_date_year: !isSearchRequest && type === 'tv' ? year || undefined : undefined,
        with_genres: !isSearchRequest && type !== 'person' ? genre || undefined : undefined,
        ...(isSearchRequest && type === 'movie' && year ? { primary_release_year: year } : {}),
        ...(isSearchRequest && type === 'tv' && year ? { first_air_date_year: year } : {}),
      });

      finalData = {
        page: fetchedData.page,
        results: [],
        total_pages: fetchedData.total_pages,
        total_results: fetchedData.total_results
      };

      if (fetchedData.results) {
        if (type === 'person') {
          finalData.results = attachPersonType(fetchedData.results as PersonItem[]);
        } else if (type === 'movie' || type === 'tv') {
          finalData.results = attachMediaType(fetchedData.results as MediaItem[], type);
        } else {
          finalData.results = fetchedData.results as SearchResultItem[];
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
