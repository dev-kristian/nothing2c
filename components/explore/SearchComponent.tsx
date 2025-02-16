'use client'
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AnimatedTitle from '../AnimatedTitle';

interface SearchComponentProps {
  className?: string;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Add a slight delay to ensure the loading state is visible
      await new Promise(resolve => setTimeout(resolve, 100));
      await router.push(`/search/${encodeURIComponent(searchQuery)}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      // We'll keep the loading state until the navigation completes
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <form onSubmit={handleSearch} className={`${className} w-full`}>
      <div className="container mx-auto flex flex-col items-center space-y-2">
        <AnimatedTitle>
          {(className) => (
            <div className="text-center">
              <span className={className}>Explore </span>
              <span className="text-primary/50">Movies</span>
              <span className={className}> and </span>
              <span className="text-primary/50">TV Shows</span>
            </div>
          )}
        </AnimatedTitle>
        <div className="relative w-full">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for movies, TV shows, or people..."
            disabled={isLoading}
            className="w-full bg-background-light text-foreground placeholder-muted-foreground border-none focus:ring-2 focus:ring-primary rounded-full truncated"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            aria-disabled={isLoading}
            className={`
              absolute right-0 top-1/2 transform -translate-y-1/2 
              bg-primary/50 hover:bg-primary/70 text-primary-foreground 
              transition-all duration-300 rounded-full px-2 md:px-4
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center
            `}
          >
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </>
              )}
            </div>
          </Button>
        </div>
      </div>
    </form>
  );
};

export default SearchComponent;