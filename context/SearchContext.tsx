import React, { createContext, useContext, useState, useCallback } from 'react';
import { SearchResult, SearchState, SearchContextType } from '@/types';

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    isLoading: false,
    error: null,
  });

  const setSearchResults = useCallback((results: SearchResult[]) => {
    setSearchState(prev => ({ ...prev, results, isLoading: false, error: null }));
  }, []);

  const setIsLoading = useCallback((isLoading: boolean) => {
    setSearchState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setSearchState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchState({ results: [], isLoading: false, error: null });
  }, []);

  return (
    <SearchContext.Provider value={{ searchState, setSearchResults, setIsLoading, setError, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
};