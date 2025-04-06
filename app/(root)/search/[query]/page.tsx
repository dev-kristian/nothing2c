// app/search/[query]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

interface SearchResult {
  id: number
  title?: string
  name?: string
  media_type: string
  poster_path?: string
  profile_path?: string
  release_date?: string
  first_air_date?: string
  overview?: string
}

export default function SearchResultsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const query = params.query as string
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get advanced search params
  const type = searchParams.get('type') || 'multi'
  const year = searchParams.get('year')
  const genre = searchParams.get('genre')
  const includeAdult = searchParams.get('adult') === 'true'
  
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Build search params
        const params = new URLSearchParams()
        if (query && query !== 'discover') params.append('query', query)
        if (type) params.append('type', type)
        if (year) params.append('year', year)
        if (genre) params.append('genre', genre)
        params.append('include_adult', includeAdult.toString())
        
        const response = await fetch(`/api/search?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results')
        }
        
        const data = await response.json()
        setResults(data.results || [])
      } catch (err) {
        console.error('Search error:', err)
        setError('Failed to load search results. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchResults()
  }, [query, type, year, genre, includeAdult])
  
  // Generate page title based on search parameters
  const getPageTitle = () => {
    if (query && query !== 'discover') {
      return `Search results for "${query}"`
    }
    
    const parts = []
    if (type !== 'multi') {
      parts.push(type === 'movie' ? 'Movies' : type === 'tv' ? 'TV Shows' : 'People')
    }
    if (year) parts.push(`from ${year}`)
    if (genre) {
      const genreName = genres.find(g => g.id.toString() === genre)?.name
      if (genreName) parts.push(genreName)
    }
    
    return parts.length > 0 
      ? `Discovering ${parts.join(' ')}` 
      : 'Discover content'
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{getPageTitle()}</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-pink" />
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-red-500">{error}</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg">No results found.</p>
          <p className="text-foreground/60 mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {results.map(result => (
            <div key={result.id} className="bg-background/50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              {(result.poster_path || result.profile_path) ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${result.poster_path || result.profile_path}`}
                  alt={result.title || result.name || "Media content"}
                  className="w-full aspect-[2/3] object-cover"
                  width={150}
                  height={150}
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-foreground/10 flex items-center justify-center">
                  <span className="text-foreground/40">No image</span>
                </div>
              )}
              <div className="p-3">
                <h3 className="font-medium text-sm truncate">{result.title || result.name}</h3>
                <div className="flex justify-between items-center mt-1 text-xs text-foreground/60">
                  <span className="capitalize">{result.media_type}</span>
                  {(result.release_date || result.first_air_date) && (
                    <span>
                      {new Date(result.release_date || result.first_air_date || '').getFullYear()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// TMDB genres (same as in SearchComponent)
const genres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];
