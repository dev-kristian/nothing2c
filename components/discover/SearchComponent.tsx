'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserData } from '@/context/UserDataContext';
import { GENRES_BY_TYPE, Genre } from '@/constants/genres';

interface SearchComponentProps {
  className?: string;
  initialQuery?: string;
  initialType?: string;
  initialYear?: string | null;
  initialGenre?: string | null; 
  initialIncludeAdult?: boolean;
  hideTitleSection?: boolean;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

const SearchComponent: React.FC<SearchComponentProps> = ({ 
  className,
  initialQuery = '',
  initialType = 'multi',
  initialYear = null,
  initialGenre = null,
  initialIncludeAdult = false,
  hideTitleSection = false,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(
    !!initialQuery && (!!initialYear || !!initialGenre || initialIncludeAdult)
  );
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedYear, setSelectedYear] = useState<string | null>(initialQuery.trim() ? initialYear : null); 
  const [selectedGenre, setSelectedGenre] = useState<number | null>(initialGenre ? parseInt(initialGenre, 10) : null);
  const [includeAdult, setIncludeAdult] = useState(initialIncludeAdult);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);

  const currentGenreList: Genre[] = (selectedType === 'movie' || selectedType === 'tv') ? GENRES_BY_TYPE[selectedType] : [];
  const selectedGenreName = currentGenreList.find(g => g.id === selectedGenre)?.name;


  const inputRef = useRef<HTMLInputElement>(null);
  const advancedSearchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { userData } = useUserData();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim() && selectedType === 'person') return;

    const isTypeFilterActive = selectedType !== 'multi';
    const isYearFilterActive = selectedType !== 'person' && !!selectedYear;
    const isGenreFilterActive = selectedType !== 'person' && !!selectedGenre;
    const isAdultFilterActive = includeAdult;
    const isAnyFilterActive = isTypeFilterActive || isYearFilterActive || isGenreFilterActive || isAdultFilterActive;

    if (!searchQuery.trim() && selectedType === 'person') return;

    if (!searchQuery.trim() && !isAnyFilterActive) return;


    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (selectedType) params.append('type', selectedType);
      if (selectedYear) params.append('year', selectedYear);
      if (selectedGenre) params.append('genre', selectedGenre.toString());
      params.append('include_adult', includeAdult.toString());
      
      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      let searchPath = '/search';
      if (searchQuery.trim()) {
        searchPath += `/${encodeURIComponent(searchQuery)}`;
      } else {
        searchPath += '/discover';
      }
      
      const advancedParams = new URLSearchParams();
      if (selectedType !== 'multi') advancedParams.append('type', selectedType);
      if (selectedYear) advancedParams.append('year', selectedYear);
      if (selectedGenre) advancedParams.append('genre', selectedGenre.toString());
      if (includeAdult) advancedParams.append('adult', 'true');
      
      const queryString = advancedParams.toString();
      if (queryString) {
        searchPath += `?${queryString}`;
      }
      
      router.push(searchPath);
    } catch (error) {
      console.error('Search error:', error);
    } 
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const resetAdvancedFilters = () => {
    setSelectedType('multi');
    setSelectedYear(null);
    setSelectedGenre(null);
    setIncludeAdult(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        advancedSearchRef.current && 
        !advancedSearchRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('[data-advanced-toggle]')
      ) {
        setShowAdvanced(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <form onSubmit={handleSearch} className={`${className} w-full px-2 sm:px-4 md:px-6`}>
      <div className="container mx-auto flex flex-col items-center">
        {!hideTitleSection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
            className="text-center w-full mb-3 sm:mb-4 md:mb-6"
          >
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-foreground/70 text-xs sm:text-sm font-medium mb-1"
            >
              {userData ? (
                <>
                  Hi, <span className="text-pink font-semibold">{userData.username}</span>. Ready to
                  discover?
                </>
              ) : (
                <>Welcome to Nothing <sup>2C</sup></>
              )}
            </motion.p>
    
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="font-semibold tracking-tight text-lg sm:text-xl md:text-2xl lg:text-4xl mb-3 sm:mb-4 md:mb-6"
            >
              <span className="text-gray-5-dark dark:text-gray-5">Explore </span>
              <span className="text-pink dark:text-pink-dark font-semibold">Movies</span>
              <span className="text-gray-5-dark dark:text-gray-5"> and </span>
              <span className="text-pink dark:text-pink-dark font-semibold">TV Shows</span>
            </motion.div>
          </motion.div>
        )}
  
        <motion.div
          className="relative w-full max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div
            className={`
              frosted-panel p-0 rounded-full shadow-lg overflow-hidden
              transition-all duration-300 ease-out
              ${isFocused ? 'ring-1 ring-pink/50 shadow-xl' : ''}
            `}
          >
            <div className="flex items-center p-1 sm:p-1.5 md:p-2">
              <div className="flex-shrink-0 pl-2 sm:pl-3">
                <Search
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-300 ${
                    isFocused ? 'text-pink' : 'text-foreground/50'
                  }`}
                />
              </div>
              
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const newQuery = e.target.value;
                  setSearchQuery(newQuery);
                  if (selectedType === 'multi' && !newQuery.trim()) {
                    setSelectedYear(null);
                  }
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search movies, TV shows..."
                aria-label="Search for movies, TV shows, or people"
                className="flex-grow bg-transparent text-foreground placeholder-foreground/50 border-none 
                          py-1.5 sm:py-2 px-1.5 sm:px-2 md:px-3 text-xs sm:text-sm md:text-base focus:outline-none focus:ring-0"
              />
              
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClearSearch}
                    className="flex-shrink-0 p-1 sm:p-1.5 text-foreground/50 hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </motion.button>
                )}
              </AnimatePresence>
              
              <div className="h-5 sm:h-6 w-px bg-foreground/10 mx-0.5 sm:mx-1"></div>
              
              <button
                type="button"
                data-advanced-toggle
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`
                  flex-shrink-0 p-1 sm:p-1.5 rounded-lg transition-colors
                  ${showAdvanced 
                    ? 'bg-pink/10 text-pink' 
                    : 'text-foreground/50 hover:text-foreground hover:bg-foreground/10'
                  }
                `}
                aria-label="Advanced search options"
                aria-expanded={showAdvanced}
              >
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              
              <div className="h-5 sm:h-6 w-px bg-foreground/10 mx-0.5 sm:mx-1"></div>
              
              <motion.button
                type="submit"
                disabled={
                  (selectedType === 'person' && !searchQuery.trim()) ||
                  (selectedType === 'multi' && !searchQuery.trim() && !selectedGenre && !includeAdult) ||
                  ((selectedType === 'movie' || selectedType === 'tv') && !searchQuery.trim() && !selectedYear && !selectedGenre)
                }
                aria-label={"Search"}
                className={`
                  flex-shrink-0 bg-pink hover:bg-pink-hover text-white
                  transition-all duration-300 rounded-2xl py-1 sm:py-1.5 px-2.5 sm:px-3 md:px-4 mx-0.5 sm:mx-1 /* Adjusted base px */
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center sm:space-x-2">
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline text-2xs sm:text-xs md:text-sm">Search</span>
                </div>
              </motion.button>
            </div>
          </div>
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              ref={advancedSearchRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-10 mt-2 w-full frosted-panel rounded-2xl sm:rounded-3xl p-3 sm:p-4"
            >
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-foreground/90">Advanced Search</h3>
                <button 
                  type="button"
                  onClick={resetAdvancedFilters}
                  className="text-2xs sm:text-xs text-pink hover:text-pink-hover transition-colors"
                >
                  Reset filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-2xs sm:text-xs text-foreground/70 font-medium">Content Type</label>
                  <div className="flex p-1 bg-white/20 dark:bg-black/20 rounded-xl">
                    {[
                      { value: 'multi', label: 'All' },
                      { value: 'movie', label: 'Movies' },
                      { value: 'tv', label: 'TV' },
                      { value: 'person', label: 'People' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSelectedType(option.value);
                          // Reset genre if switching to multi or person
                          if (option.value === 'multi' || option.value === 'person') {
                            setSelectedGenre(null);
                          }
                        }}
                        className={`flex-1 py-1.5 px-2 text-2xs sm:text-xs rounded-lg transition-all duration-200 ${
                          selectedType === option.value
                            ? 'bg-white dark:bg-gray-800 text-foreground shadow-sm' 
                            : 'text-foreground/70 hover:text-foreground'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

        {/* Show Year filter if type is not 'person' AND (type is not 'multi' OR there is a search query) */}
        {selectedType !== 'person' && (selectedType !== 'multi' || searchQuery.trim()) && (
        <div className="space-y-1.5">
          <label className="text-2xs sm:text-xs text-foreground/70 font-medium">Release Year</label>
          <div className="relative">
            {/* This is the correct Year filter section */}
            <button
              type="button"
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              className="w-full flex items-center justify-between bg-white/20 dark:bg-black/20 border-none
                        text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl
                        focus:outline-none focus:ring-1 focus:ring-pink/50"
            >
              <span>{selectedYear || 'Any Year'}</span>
              <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground/50 transition-transform duration-200 ${yearDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {yearDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-20 mt-1 w-full max-h-60 overflow-auto frosted-panel rounded-xl shadow-lg p-1"
                >
                  <div 
                    className="p-2 text-xs hover:bg-pink/10 rounded-lg cursor-pointer"
                    onClick={() => {
                      setSelectedYear(null);
                      setYearDropdownOpen(false);
                    }}
                  >
                    Any Year
                  </div>
                  <div className="border-t border-foreground/10 my-1"></div>
                  {years.map(year => (
                    <div 
                      key={year} 
                      className={`p-2 text-xs rounded-lg cursor-pointer ${selectedYear === year.toString() ? 'bg-pink/10 text-pink' : 'hover:bg-foreground/10'}`}
                      onClick={() => {
                        setSelectedYear(year.toString());
                        setYearDropdownOpen(false);
                      }}
                    >
                      {year}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        )}

        {/* Only show Genre filter if type is 'movie' or 'tv' */}
        {(selectedType === 'movie' || selectedType === 'tv') && (
          <div className="space-y-1.5">
            <label className="text-2xs sm:text-xs text-foreground/70 font-medium">Genre</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
                className="w-full flex items-center justify-between bg-white/20 dark:bg-black/20 border-none
                          text-xs sm:text-sm py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl
                          focus:outline-none focus:ring-1 focus:ring-pink/50"
              >
                <span>{selectedGenreName || 'Any Genre'}</span>
                <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground/50 transition-transform duration-200 ${genreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {genreDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 mt-1 w-full max-h-60 overflow-auto frosted-panel rounded-xl shadow-lg p-1"
                  >
                    <div 
                      className="p-2 text-xs hover:bg-pink/10 rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedGenre(null);
                        setGenreDropdownOpen(false);
                      }}
                    >
                      Any Genre
                    </div>
                    <div className="border-t border-foreground/10 my-1"></div>
                    {currentGenreList.map(genre => (
                      <div
                        key={genre.id}
                        className={`p-2 text-xs rounded-lg cursor-pointer ${selectedGenre === genre.id ? 'bg-pink/10 text-pink' : 'hover:bg-foreground/10'}`}
                        onClick={() => {
                          setSelectedGenre(genre.id);
                          setGenreDropdownOpen(false);
                        }}
                      >
                        {genre.name}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

                
                <div className="pt-1">
                  <label className="inline-flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={includeAdult} 
                        onChange={() => setIncludeAdult(!includeAdult)}
                        className="sr-only peer"
                      />
                      <div className="w-9 sm:w-11 h-5 sm:h-6 bg-foreground/20 
                                    peer-focus:outline-none rounded-full peer 
                                    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                    peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                                    after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full 
                                    after:h-4 sm:after:h-5 after:w-4 sm:after:w-5 after:transition-all 
                                    peer-checked:bg-pink shadow-inner">
                      </div>
                    </div>
                    <span className="ms-2 sm:ms-3 text-xs sm:text-sm font-medium">Include adult content</span>
                  </label>
                </div>
              </div>
              
              {(selectedType !== 'multi' || selectedYear || selectedGenre || includeAdult) && (
                <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-foreground/10">
                  <h4 className="text-2xs sm:text-xs text-foreground/70 font-medium mb-2 sm:mb-3">Active Filters:</h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {selectedType !== 'multi' && (
                      <div className="bg-pink/10 text-pink text-2xs sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full flex items-center">
                        {selectedType === 'movie' ? 'Movies' : selectedType === 'tv' ? 'TV Shows' : 'People'}
                        <button 
                          type="button" 
                          onClick={() => setSelectedType('multi')}
                          className="ml-1 sm:ml-1.5 hover:bg-pink/20 rounded-full p-0.5"
                          aria-label="Remove filter"
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    )}

                    {/* Show Year filter badge if selectedYear exists AND (type is not 'multi' OR there is a search query) */}
                    {selectedYear && selectedType !== 'person' && (selectedType !== 'multi' || searchQuery.trim()) && (
                      <div className="bg-pink/10 text-pink text-2xs sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full flex items-center">
                        Year: {selectedYear}
                        <button
                          type="button" 
                          onClick={() => setSelectedYear(null)}
                          className="ml-1 sm:ml-1.5 hover:bg-pink/20 rounded-full p-0.5"
                          aria-label="Remove year filter"
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    )}
                    {/* Only show Genre filter badge if type is 'movie' or 'tv' */}
                    {selectedGenre && (selectedType === 'movie' || selectedType === 'tv') && (
                      <div className="bg-pink/10 text-pink text-2xs sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full flex items-center">
                        {selectedGenreName}
                        <button
                          type="button"
                          onClick={() => setSelectedGenre(null)}
                          className="ml-1 sm:ml-1.5 hover:bg-pink/20 rounded-full p-0.5"
                          aria-label="Remove genre filter"
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    )}
                    
                    {includeAdult && (
                      <div className="bg-pink/10 text-pink text-2xs sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full flex items-center">
                        Adult Content
                        <button 
                          type="button" 
                          onClick={() => setIncludeAdult(false)}
                          className="ml-1 sm:ml-1.5 hover:bg-pink/20 rounded-full p-0.5"
                          aria-label="Remove adult content filter"
                        >
                          <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 text-center text-2xs sm:text-xs text-foreground/40 hidden sm:block">
          <span>Press </span>
          <kbd className="px-1 sm:px-1.5 py-0.5 rounded bg-foreground/10 font-mono text-foreground/70">
            ⌘K
          </kbd>
          <span> or </span>
          <kbd className="px-1 sm:px-1.5 py-0.5 rounded bg-foreground/10 font-mono text-foreground/70">
            Ctrl+K
          </kbd>
          <span> to search</span>
        </div>
      </motion.div>
    </div>
  </form>
);
};

export default SearchComponent;
