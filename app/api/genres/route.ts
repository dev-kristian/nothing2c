// app/api/genres/route.ts
import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.NEXT_PRIVATE_TMDB_API_KEY;

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type || (type !== 'movie' && type !== 'tv')) {
    return NextResponse.json({ error: 'Invalid or missing type parameter' }, { status: 400 });
  }

  const url = `https://api.themoviedb.org/3/genre/${type}/list?language=en`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_API_KEY}`,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch genres from TMDB');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching genres from TMDB:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}