// app/(root)/search/[searchquery]/page.tsx

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SearchResultsContent from './SearchResultsContet';
import Spinner from '@/components/Spinner';
import { headers } from 'next/headers';

interface SearchResultsPageProps {
  params: {
    searchquery: string;
  };
}

async function getSearchResults(query: string) {
  const host = headers().get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const response = await fetch(`${protocol}://${host}/api/search?query=${encodeURIComponent(query)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Failed to fetch search results');
  return response.json();
}

export default async function SearchResultsPage({ params }: SearchResultsPageProps) {
  const { searchquery } = params;
  const decodedQuery = decodeURIComponent(searchquery);
  const searchResults = await getSearchResults(searchquery);

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center py-8">
        <h1 className="text-4xl font-bold">
          Search Results for &ldquo;<span className="text-pink-500">{decodedQuery}</span>&rdquo;
        </h1>
        <Link href="/explore">
          <Button variant="outline">
            Back to Explore
          </Button>
        </Link>
      </div>

      <Suspense fallback={<Spinner />}>
        <SearchResultsContent results={searchResults.results} />
      </Suspense>
    </div>
  );
}
