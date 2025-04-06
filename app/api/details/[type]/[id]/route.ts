// app/api/details/[type]/[id]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { type: string; id: string } }
) {
  const bearerToken = process.env.NEXT_PRIVATE_TMDB_API_KEY;
  const { type, id } = params;

  try {
    const detailsUrl = `https://api.themoviedb.org/3/${type}/${id}?language=en-US&append_to_response=credits,external_ids`;

    const response = await fetch(detailsUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch details from TMDB: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from TMDB:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
