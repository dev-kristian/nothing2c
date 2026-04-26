// app/api/details/[type]/[id]/route.ts
import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;

  try {
    const appendToResponse = type === 'person'
      ? 'combined_credits,images,external_ids'
      : `credits,external_ids,videos,reviews,recommendations,similar,watch/providers,${type === 'movie' ? 'release_dates' : 'content_ratings'}`;

    const data = await tmdbFetch(`/${type}/${id}`, {
      params: {
        language: 'en-US',
        append_to_response: appendToResponse,
        ...(type === 'person' ? { include_image_language: 'en,null' } : {}),
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
