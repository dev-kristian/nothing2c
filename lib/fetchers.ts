import { Media } from '@/types/media';

export type DiscoverMediaType = 'movie' | 'tv' | 'upcoming';

export interface ApiResponse {
  results: Media[];
  total_pages: number;
  page?: number;
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

  const absoluteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}${finalUrl}`;

  const response = await fetch(absoluteUrl, requestOptions);

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
