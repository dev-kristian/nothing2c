const TMDB_API_BASE = 'https://api.themoviedb.org/3';

interface TmdbFetchOptions {
  params?: Record<string, string | number | boolean | undefined | null>;
  revalidate?: number;
}

export function buildTmdbUrl(
  path: string,
  params: Record<string, string | number | boolean | undefined | null> = {}
) {
  const url = new URL(`${TMDB_API_BASE}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function tmdbFetch<T>(
  path: string,
  { params, revalidate = 3600 }: TmdbFetchOptions = {}
): Promise<T> {
  const bearerToken = process.env.NEXT_PRIVATE_TMDB_API_KEY;

  if (!bearerToken) {
    throw new Error('TMDB bearer token is not configured.');
  }

  const response = await fetch(buildTmdbUrl(path, params), {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      accept: 'application/json',
    },
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed (${path}): ${response.status}`);
  }

  return response.json() as Promise<T>;
}
