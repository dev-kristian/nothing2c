import React, { useState, useRef,useCallback } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
// Added Search icon back
import { Film, Star, Calendar, ThumbsUp, Plus, X, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFriendsWatchlist } from '@/context/FriendsWatchlistContext';
import Image from 'next/image';
import { useOutsideClickHandler } from '@/utils/movieNightInvitationUtils'; // Keep this one
import { useSession } from '@/context/SessionContext';
import { FriendsWatchlistItem, Session, Poll, MediaPollItem, SearchResult } from '@/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast'; // Import useToast

// Define the structure expected from the /api/search endpoint
interface ApiSearchResponse {
  page: number;
  results: SearchResult[]; // Use SearchResult
  total_pages: number;
  total_results: number;
}

interface MediaSuggestionsProps {
  session: Session;
  poll: Poll | undefined;
  isReadOnly?: boolean;
  userId?: string; // Added userId prop
}

// --- SuggestionItem Component Definition (Moved outside main component) ---
interface SuggestionItemProps {
    item: FriendsWatchlistItem | SearchResult;
    onSelect: (item: FriendsWatchlistItem | SearchResult) => void;
    getReleaseYear: (date: string | null | undefined) => string | null;
}

const SuggestionItem: React.FC<SuggestionItemProps> = ({ item, onSelect, getReleaseYear }) => {
    // Determine title, type, and release date safely
    const title = item.title ?? (item as SearchResult).name ?? 'Unknown Title';
    const type = item.media_type === 'tv' ? 'tv' : 'movie'; // Default to movie if media_type is missing
    const releaseDate = item.release_date ?? (item as SearchResult).first_air_date;
    const year = getReleaseYear(releaseDate);

    return (
      <div
        // Use a unique key combining source and id
        key={`${'media_type' in item ? item.media_type : 'friend'}-${item.id}`}
        className="px-4 py-2.5 hover:bg-system-pink/5 cursor-pointer flex items-center border-b border-separator/10 dark:border-separator-dark/10 last:border-b-0"
        onClick={() => onSelect(item)}
      >
        {item.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
            alt={title}
            width={30}
            height={45}
            className="object-cover rounded-md mr-3 flex-shrink-0"
          />
        ) : (
          <div className="w-[30px] h-[45px] bg-gray-4 dark:bg-gray-4-dark rounded-md mr-3 flex items-center justify-center flex-shrink-0">
            <Film size={16} className="text-gray-2 dark:text-gray-2-dark" />
          </div>
        )}
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-label dark:text-label-dark truncate">
            {title}
          </p>
          <div className="flex items-center text-xs text-label-secondary dark:text-label-secondary-dark">
            <span>{type === 'tv' ? 'TV Show' : 'Movie'}</span>
            {year && (
              <span className="ml-2">{year}</span>
            )}
          </div>
        </div>
      </div>
    );
};
// --- End SuggestionItem Component Definition ---


const MediaSuggestions: React.FC<MediaSuggestionsProps> = ({ session, poll, isReadOnly = false, userId }) => {
  const [inputMediaTitle, setInputMediaTitle] = useState<string>('');
  const [watchlistSuggestions, setWatchlistSuggestions] = useState<FriendsWatchlistItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [activeSuggestionSource, setActiveSuggestionSource] = useState<'watchlist' | 'search' | null>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { friendsWatchlistItems } = useFriendsWatchlist();
  const { toggleVote, addMovieToPoll, removeMovieFromPoll } = useSession();
  // const { userData } = useAuthUser(); // userData seems unused, commenting out for now

  useOutsideClickHandler(inputContainerRef, () => {
    setWatchlistSuggestions([]);
    setSearchResults([]);
    setActiveSuggestionSource(null);
    if (inputMediaTitle.trim() === '') {
      setShowInput(false);
    }
  });

  // --- Removed automatic search useEffect ---

  // Function to explicitly trigger API search
  const handleApiSearch = useCallback(async () => {
    if (inputMediaTitle.trim().length < 2 || isSearching) {
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]); // Clear previous results
    setActiveSuggestionSource('search'); // Show search section in dropdown

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(inputMediaTitle)}&page=1`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data: ApiSearchResponse = await response.json();
      const filteredResults = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
      setSearchResults(filteredResults);
      if (filteredResults.length === 0) {
        setSearchError("No matching movies or TV shows found.");
      }
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      setSearchError('Failed to load search results.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [inputMediaTitle, isSearching]); // Dependencies: inputMediaTitle, isSearching

  const isSessionCreator = userId === session.createdByUid;

  const handleSelectSuggestion = useCallback(async (item: FriendsWatchlistItem | SearchResult) => {
    if (isReadOnly) return;

    const mediaItem: MediaPollItem = {
      id: item.id,
      type: item.media_type === 'tv' ? 'tv' : 'movie',
      title: item.title || (item as SearchResult).name || 'Unknown Title',
      poster_path: item.poster_path || null,
      release_date: item.release_date || (item as SearchResult).first_air_date || null,
      vote_average: item.vote_average || null,
    };

    try {
      // Use the correct function signature for addMovieToPoll
      await addMovieToPoll(session.id, mediaItem);
      setInputMediaTitle('');
      setWatchlistSuggestions([]);
      setSearchResults([]);
      setActiveSuggestionSource(null);
      setShowInput(false);
      toast({
        title: "Suggestion Added",
        description: `"${mediaItem.title}" added to the poll.`,
      });
    } catch (error: unknown) {
      console.error('Error adding media item to poll:', error);
      // Check if error is an instance of Error before accessing message
      const description = error instanceof Error ? error.message : "Could not add the selected item. It might already be in the poll.";
      toast({
        title: "Error Adding Suggestion",
        description: description,
        variant: "destructive",
      });
    }
  }, [addMovieToPoll, isReadOnly, session.id, toast]);

  const handleVote = async (mediaId: number) => {
    if (isReadOnly || !userId) return;
    try {
      // Use the correct function signature for toggleVote
      await toggleVote(session.id, mediaId);
    } catch (error) {
      console.error('Error toggling vote for media:', error);
      toast({
        title: "Vote Error",
        description: "Could not update your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getVoteCount = (mediaId: number) => {
    if (!poll?.votes) return 0;
    return Object.values(poll.votes).reduce(
      (count, userVotes) => count + (userVotes?.includes(mediaId) ? 1 : 0),
      0
    );
  };

  const hasVoted = (mediaId: number) => {
    if (!poll?.votes || !userId) return false;
    const userVotes = poll.votes[userId] || [];
    return userVotes.includes(mediaId);
  };

  const getReleaseYear = (date: string | null | undefined): string | null => {
    if (!date) return null;
    try {
      // Ensure date is treated as string before passing to Date constructor
      return format(new Date(String(date)), 'yyyy');
    } catch {
      console.error('Invalid date format:', date);
      return null;
    }
  };

  return (
    <div className="mt-6 frosted-panel p-2">
      <div className="flex items-center justify-between mb-5">
        <div ref={inputContainerRef} className="relative">
          {showInput ? (
            <div className="flex items-center relative"> {/* Added relative positioning here */}
              <Input
                value={inputMediaTitle}
                onChange={(e) => {
                  const term = e.target.value;
                  setInputMediaTitle(term);
                  // Only filter/show watchlist suggestions on change
                  if (term.trim() === '') {
                    setWatchlistSuggestions([]);
                    setActiveSuggestionSource(null);
                    setSearchResults([]); // Clear search results too
                    setSearchError(null);
                  } else {
                    const allWatchlistItems = [...friendsWatchlistItems.movie, ...friendsWatchlistItems.tv];
                    const filtered = allWatchlistItems.filter(item =>
                      (item.title || item.name)?.toLowerCase().includes(term.toLowerCase())
                    );
                    setWatchlistSuggestions(filtered);
                    setActiveSuggestionSource('watchlist'); // Prioritize watchlist suggestions while typing
                    setSearchResults([]); // Clear search results when typing changes
                    setSearchError(null);
                  }
                }}
                 onFocus={() => {
                   // Only show watchlist suggestions on focus if input is empty
                   if (inputMediaTitle.trim() === '') {
                     const allWatchlistItems = [...friendsWatchlistItems.movie, ...friendsWatchlistItems.tv];
                     setWatchlistSuggestions(allWatchlistItems);
                     setActiveSuggestionSource('watchlist');
                   }
                   // Don't trigger API search on focus
                 }}
                 // Add onKeyDown handler for Enter key press
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && inputMediaTitle.trim().length >= 2) {
                     e.preventDefault(); // Prevent form submission if applicable
                     handleApiSearch(); // Trigger search on Enter
                   }
                 }}
                placeholder="Suggest Movie/TV Show..."
                className="w-60 text-sm rounded-full border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-md pr-10" // Added padding for button
                autoFocus
                disabled={isReadOnly}
              />
              {/* Add Search Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/10"
                onClick={handleApiSearch}
                disabled={isReadOnly || inputMediaTitle.trim().length < 2 || isSearching}
                aria-label="Search for suggestions"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setShowInput(true)}
              className="h-9 rounded-full px-4 bg-white/10 dark:bg-black/10 backdrop-blur-sm text-sm text-label-secondary dark:text-label-secondary-dark border border-white/10 dark:border-white/5 hover:bg-white/20 dark:hover:bg-black/20"
              disabled={isReadOnly}
            >
              <Plus size={14} className="mr-1" /> Suggest
            </Button>
          )}

          {/* Combined Suggestions Dropdown */}
          {(activeSuggestionSource === 'watchlist' && watchlistSuggestions.length > 0) ||
           // Show dropdown if watchlist suggestions exist OR if search has been triggered
           ((activeSuggestionSource === 'watchlist' && watchlistSuggestions.length > 0) || activeSuggestionSource === 'search') ? (
            <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-4 dark:border-white no-scrollbar shadow-apple dark:shadow-apple-dark bg-white dark:bg-gray-6-dark backdrop-blur-md backdrop-saturate-150">
              {/* Show Watchlist Suggestions if active */}
              {activeSuggestionSource === 'watchlist' && watchlistSuggestions.map((item) => (
                <SuggestionItem key={`wl-${item.id}`} item={item} onSelect={handleSelectSuggestion} getReleaseYear={getReleaseYear} />
              ))}

              {/* Show Search Section if active */}
              {activeSuggestionSource === 'search' && (
                <>
                  {/* Search Status */}
                  {isSearching && (
                    <div className="px-4 py-2.5 text-sm text-label-secondary dark:text-label-secondary-dark flex items-center">
                      <Loader2 size={16} className="animate-spin mr-2" /> Searching...
                    </div>
                  )}
                  {searchError && !isSearching && (
                     <div className="px-4 py-2.5 text-sm text-system-red dark:text-system-red-dark">{searchError}</div>
                  )}
                  {/* Display Search Results */}
                  {!isSearching && searchResults.map((item) => (
                     <SuggestionItem key={`sr-${item.id}`} item={item} onSelect={handleSelectSuggestion} getReleaseYear={getReleaseYear} />
                  ))}
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Render Poll Items */}
      {!poll?.mediaItems || poll.mediaItems.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center rounded-xl bg-white/5 dark:bg-black/5 border border-white/10 dark:border-white/5">
          <Film className="w-12 h-12 text-label-tertiary dark:text-label-tertiary-dark mb-3" />
          <p className="text-label-secondary dark:text-label-secondary-dark text-center">
            No media suggestions yet
          </p>
          <p className="text-xs text-label-tertiary dark:text-label-tertiary-dark text-center mt-1 max-w-md">
            Suggest a movie or TV show for the group to watch
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {poll.mediaItems.map((mediaItem) => {
            const voteCount = getVoteCount(mediaItem.id);
            const voted = hasVoted(mediaItem.id);
            const releaseYear = getReleaseYear(mediaItem.release_date);

            return (
              <motion.div
                key={mediaItem.id}
                className={`p-3 rounded-xl border ${
                  voted
                    ? 'bg-system-pink/5 dark:bg-system-pink-dark/10 border-system-pink/10 dark:border-system-pink-dark/10'
                    : 'bg-white/5 dark:bg-black/5 border-white/10 dark:border-white/5'
                } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'} transition-all duration-200 ${!isReadOnly ? 'hover:bg-white/10 dark:hover:bg-black/10' : ''}`}
                whileHover={!isReadOnly ? { scale: 1.005 } : {}}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                onClick={() => handleVote(mediaItem.id)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    {mediaItem.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${mediaItem.poster_path}`}
                        alt={mediaItem.title}
                        width={50}
                        height={75}
                        className="object-cover rounded-md shadow-sm"
                      />
                    ) : (
                      <div className="w-[50px] h-[75px] bg-gray-5 dark:bg-gray-5-dark rounded-md flex items-center justify-center shadow-sm">
                        <Film size={20} className="text-gray-3 dark:text-gray-3-dark" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/details/${mediaItem.type}/${mediaItem.id}`}
                        className="hover:text-system-pink dark:hover:text-system-pink-dark transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h4 className="font-medium text-base text-label dark:text-label-dark">{mediaItem.title}</h4>
                      </Link>

                      <div className="flex items-center">
                        <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center ${
                          voted
                            ? 'bg-system-pink/15 text-system-pink dark:bg-system-pink-dark/15 dark:text-system-pink-dark'
                            : 'bg-gray-6 dark:bg-gray-5-dark text-label-secondary dark:text-label-secondary-dark'
                        }`}>
                          <ThumbsUp size={14} className="mr-1.5" />
                          {voteCount}
                        </span>

                        {isSessionCreator && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!isReadOnly) {
                                try {
                                  // Use correct function signature for removeMovieFromPoll
                                  await removeMovieFromPoll(session.id, mediaItem.id);
                                  toast({
                                    title: "Suggestion Removed",
                                    description: `"${mediaItem.title}" removed from the poll.`,
                                  });
                                } catch (error: unknown) {
                                  console.error("Error removing suggestion:", error);
                                  // Check if error is an instance of Error before accessing message
                                  const removeDescription = error instanceof Error ? error.message : "Could not remove the item.";
                                  toast({
                                    title: "Error Removing Suggestion",
                                    description: removeDescription,
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            className="ml-2 h-8 w-8 rounded-full p-0 hover:bg-system-red/10 hover:text-system-red"
                            aria-label="Remove suggestion"
                            disabled={isReadOnly}
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-label-secondary dark:text-label-secondary-dark mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {mediaItem.vote_average !== null && mediaItem.vote_average > 0 && (
                          <span className="flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow" />
                            {mediaItem.vote_average.toFixed(1)}
                          </span>
                        )}
                        {releaseYear && (
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {releaseYear}
                          </span>
                        )}
                        <span className="flex items-center text-system-pink/70 dark:text-system-pink-dark/70 font-medium">
                          {mediaItem.type === 'tv' ? 'TV Show' : 'Movie'}
                        </span>
                      </div>
                    </div>
                  </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MediaSuggestions;
