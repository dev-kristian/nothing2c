import { Media } from '@/types/media';

export type DiscoverMediaType = 'movie' | 'tv' | 'upcoming';

export interface ApiResponse {
  results: Media[];
  total_pages: number;
  page?: number;
}

function resolveApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (typeof window !== 'undefined') {
    return path;
  }

  const envBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000';

  const normalizedBaseUrl = envBaseUrl.startsWith('http')
    ? envBaseUrl
    : `https://${envBaseUrl}`;

  return new URL(path, normalizedBaseUrl).toString();
}

export const fetcher = async (url: string, mediaType: DiscoverMediaType, page: number): Promise<ApiResponse> => {
  const endpoint = mediaType === 'upcoming' ? '/api/upcoming' : '/api/trending';
  
  let requestOptions: RequestInit = {};
  let finalUrl = url;

  if (mediaType === 'upcoming') {
    finalUrl = `${endpoint}?page=${page}`; 
    requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
  } else {
    requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaType, page }),
    };
    finalUrl = endpoint;
  }

  const response = await fetch(resolveApiUrl(finalUrl), requestOptions);

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`[Fetcher Error] Failed fetch from ${endpoint}: ${response.status} ${response.statusText}`, errorData);
    throw new Error(`Failed to fetch data from ${endpoint}. Status: ${response.status}`);
  }

  try {
    return await response.json();
  } catch (e) {
    console.error(`[Fetcher Error] Failed to parse JSON from ${endpoint}:`, e);
    throw new Error(`Failed to parse response from ${endpoint}.`);
  }
};
