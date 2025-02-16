import { NextRequest, NextResponse } from 'next/server'

const TMDB_API_KEY = process.env.NEXT_PRIVATE_TMDB_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { mediaType, timeWindow, page } = await request.json()

    if (!mediaType || (mediaType !== 'movie' && mediaType !== 'tv')) {
      return NextResponse.json({ error: 'Invalid mediaType parameter' }, { status: 400 })
    }

    if (!timeWindow || (timeWindow !== 'day' && timeWindow !== 'week')) {
      return NextResponse.json({ error: 'Invalid timeWindow parameter' }, { status: 400 })
    }

    if (!TMDB_API_KEY) {
      console.error('TMDB API key is not set')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const url = `https://api.themoviedb.org/3/trending/${mediaType}/${timeWindow}?language=en-US&page=${page}`

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${TMDB_API_KEY}`,
        'accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`TMDB API responded with status ${response.status}: ${errorText}`)
      throw new Error(`Failed to fetch trending data from TMDB for ${mediaType}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in trending API route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}