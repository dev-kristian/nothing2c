// app/api/search/route.ts

import { NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.NEXT_PRIVATE_TMDB_API_KEY

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const type = searchParams.get('type') || 'multi' // movie, tv, person, or multi
  const year = searchParams.get('year')
  const genre = searchParams.get('genre')
  const sortBy = searchParams.get('sort_by') || 'popularity.desc'
  const includeAdult = searchParams.get('include_adult') === 'true'
  const page = searchParams.get('page') || '1'
  
  // Base URL depends on if we're doing a text search or advanced filtering
  let url: string
  
  if (query) {
    // Text-based search
    url = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(query)}&include_adult=${includeAdult}&language=en-US&page=${page}`
    
    // Add year filter for movie or tv searches
    if (year && (type === 'movie' || type === 'tv')) {
      const yearParam = type === 'movie' ? 'primary_release_year' : 'first_air_date_year'
      url += `&${yearParam}=${year}`
    }
  } else {
    // Discovery-based search (when no query but using filters)
    url = `https://api.themoviedb.org/3/discover/${type === 'multi' ? 'movie' : type}?include_adult=${includeAdult}&language=en-US&page=${page}&sort_by=${sortBy}`
    
    // Add year filter
    if (year) {
      const yearParam = type === 'tv' ? 'first_air_date_year' : 'primary_release_year'
      url += `&${yearParam}=${year}`
    }
    
    // Add genre filter
    if (genre) {
      url += `&with_genres=${genre}`
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch data from TMDB: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching from TMDB:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}
