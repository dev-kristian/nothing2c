'use client'

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "@/hooks/use-toast";
import { useAuthUser } from '@/context/AuthUserContext';
import { useFriendsContext } from '@/context/FriendsContext';
import { useSession } from '@/context/SessionContext';
import { useSendInvitation } from '@/hooks/useSendInvitation';
import MovieNightCalendar from './MovieNightCalendar';
import { DateTimeSelection, FriendsWatchlistItem, Friend, MediaPollItem, SearchResult } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriendsWatchlist } from '@/context/FriendsWatchlistContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, Film, Users, X, Send, Check, Search, Tv, Loader2 } from 'lucide-react'; // Added Loader2, Search
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useOutsideClickHandler } from '@/utils/movieNightInvitationUtils';

// Define the structure expected from the /api/search endpoint
interface ApiSearchResponse {
  page: number;
  results: SearchResult[];
  total_pages: number;
  total_results: number;
}

// SuggestionItem Component (accepts union type)
const SuggestionItem = React.memo(({ item, onClick }: {
  item: FriendsWatchlistItem | SearchResult;
  onClick: () => void
}) => {
  const title = item.title ?? (item as SearchResult).name ?? 'Unknown Title';
  const type = item.media_type === 'tv' ? 'tv' : 'movie';
  // Simplified release year logic for display
  const releaseDate = item.release_date ?? (item as SearchResult).first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  return (
    <motion.li
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="px-2 py-2 bg-gray-5/50 dark:bg-gray-5-dark/80 hover:bg-gray-5 hover:dark:bg-gray-5-dark flex list-item-selectable cursor-pointer rounded-lg transition-colors duration-200"
      onClick={onClick}
    >
      {item.poster_path ? (
        <div className="w-8 h-12 rounded-md overflow-hidden mr-3 shadow-sm flex-shrink-0">
          <Image
            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
            alt={title}
            width={32}
            height={48}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-8 h-12 bg-gray dark:bg-gray-dark rounded-md mr-3 flex items-center justify-center flex-shrink-0">
          {type === 'tv' ? (
            <Tv className="w-4 h-4 text-gray dark:text-gray-dark" />
          ) : (
            <Film className="w-4 h-4 text-gray dark:text-gray-dark" />
          )}
        </div>
      )}
      <div className="flex flex-col justify-center overflow-hidden">
        <span className="text-sm font-medium truncate">{title}</span>
        <span className="text-xs text-foreground/60">
          {type === 'tv' ? 'TV Show' : 'Movie'} {year ? `(${year})` : ''}
        </span>
      </div>
    </motion.li>
  );
});
SuggestionItem.displayName = "SuggestionItem";

// SelectedMediaItem Component (accepts MediaPollItem)
const SelectedMediaItem = React.memo(({ item, onRemove }: {
  item: MediaPollItem;
  onRemove: () => void
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="flex items-center justify-between list p-2 rounded-xl"
  >
    <div className="flex items-center overflow-hidden">
      {item.poster_path ? (
        <div className="w-8 h-12 rounded-md overflow-hidden mr-3 shadow-sm flex-shrink-0">
          <Image
            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
            alt={item.title || ''}
            width={32}
            height={48}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-8 h-12 bg-foreground/10 rounded-md mr-3 flex items-center justify-center flex-shrink-0">
          {item.type === 'tv' ? (
            <Tv className="w-4 h-4 text-foreground/40" />
          ) : (
            <Film className="w-4 h-4 text-foreground/40" />
          )}
        </div>
      )}
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-medium truncate">{item.title}</span>
        <span className="text-xs text-foreground/60">
          {item.type === 'tv' ? 'TV Show' : 'Movie'}
        </span>
      </div>
    </div>
    <button
      onClick={onRemove}
      className="ml-2 p-1 icon-button"
      aria-label="Remove item"
    >
      <X className="w-3 h-3" />
    </button>
  </motion.div>
));
SelectedMediaItem.displayName = "SelectedMediaItem";

// FriendSelectionItem Component (Unchanged)
const FriendSelectionItem = React.memo(({ friend, isSelected, onToggle }: {
  friend: Friend;
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 ${
      isSelected
        ? 'frosted-panel border border-pink/30 dark:border-pink-dark/30 shadow-sm'
        : 'bg-foreground/5 hover:bg-foreground/10'
    }`}
    onClick={onToggle}
  >
    <div className="flex items-center">
      <Avatar className="h-8 w-8 mr-3">
        <AvatarImage src={friend.photoURL || ''} alt={friend.username} />
        <AvatarFallback className="bg-pink/20 dark:bg-pink-dark/20 text-pink dark:text-pink-dark">
          {friend.username.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium text-sm">{friend.username}</span>
    </div>
    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
      isSelected ? 'bg-pink dark:bg-pink-dark text-white' : 'bg-foreground/10'
    }`}>
      {isSelected && <Check className="w-3 h-3" />}
    </div>
  </motion.div>
));
FriendSelectionItem.displayName = "FriendSelectionItem";

// SectionHeader Component (Unchanged)
const SectionHeader = React.memo(({
  icon,
  title,
  subtitle
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-1">
      <div className="text-gray dark:text-gray-dark">{icon}</div>
      <h3 className="font-semibold tracking-tight">{title}</h3>
    </div>
    {subtitle && (
      <p className="text-xs text-foreground/60 ml-7">{subtitle}</p>
    )}
  </div>
));
SectionHeader.displayName = "SectionHeader";


export default function MovieNightInvitation() {
  const router = useRouter();
  const { userData, isLoading: userLoading } = useAuthUser();
  const { friends, isLoadingFriends } = useFriendsContext();
  const { createSession } = useSession(); // createPoll removed
  const { sendInvitation } = useSendInvitation();
  const [selectedDates, setSelectedDates] = useState<DateTimeSelection[]>([]);
  const [sendNotification, setSendNotification] = useState(true);
  const [pollMediaItems, setPollMediaItems] = useState<MediaPollItem[]>([]);
  const [inputMediaTitle, setInputMediaTitle] = useState('');
  const { friendsWatchlistItems } = useFriendsWatchlist();
  const [watchlistSuggestions, setWatchlistSuggestions] = useState<FriendsWatchlistItem[]>([]);
  const [apiSearchResults, setApiSearchResults] = useState<SearchResult[]>([]);
  const [isApiSearching, setIsApiSearching] = useState<boolean>(false);
  const [apiSearchError, setApiSearchError] = useState<string | null>(null);
  const [activeSuggestionSource, setActiveSuggestionSource] = useState<'watchlist' | 'search' | null>(null);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  // Debounce not strictly needed now but kept for potential future use
  // const debouncedSearchTerm = useDebounce(inputMediaTitle, 300); // Removed unused variable

  const handleDatesSelected = useCallback((dates: DateTimeSelection[]) => {
    setSelectedDates(dates);
  }, []);

  // Updated outside click handler
  useOutsideClickHandler(inputContainerRef, () => {
    setWatchlistSuggestions([]);
    setApiSearchResults([]);
    setActiveSuggestionSource(null);
    setApiSearchError(null);
  });

  // Function to explicitly trigger API search
  const handleApiSearch = useCallback(async () => {
    if (inputMediaTitle.trim().length < 2 || isApiSearching) {
      return;
    }
    setIsApiSearching(true);
    setApiSearchError(null);
    setApiSearchResults([]);
    setWatchlistSuggestions([]); // Clear watchlist suggestions when searching API
    setActiveSuggestionSource('search');

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(inputMediaTitle)}&page=1`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data: ApiSearchResponse = await response.json();
      const filteredResults = data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
      setApiSearchResults(filteredResults);
      if (filteredResults.length === 0) setApiSearchError("No matching movies or TV shows found.");
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      setApiSearchError('Failed to load search results.');
      setApiSearchResults([]);
    } finally {
      setIsApiSearching(false);
    }
  }, [inputMediaTitle, isApiSearching]);

  const toggleFriendSelection = useCallback((friend: Friend) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.uid === friend.uid);
      return isSelected ? prev.filter(f => f.uid !== friend.uid) : [...prev, friend];
    });
  }, []);

  // Updated completeSession (createPoll logic removed)
  const completeSession = useCallback(async () => {
    if (userLoading || !userData) {
      toast({ title: "Error", description: "User data not available.", variant: "destructive" });
      return;
    }
    try {
      setIsCreating(true);
      const sessionId = await createSession(selectedDates, selectedFriends, pollMediaItems);
      if (sendNotification && selectedFriends.length > 0 && sessionId) {
        await sendInvitation(selectedFriends, String(sessionId));
      }
      toast({ title: "Session Created", description: "Watch party created successfully!", variant: "default" });
      setSelectedDates([]);
      setPollMediaItems([]);
      setSelectedFriends([]);
      if (sessionId) router.push(`/watch-together/${String(sessionId)}`);
      else router.push('/watch-together');
    } catch (error) {
      console.error('Error completing session:', error);
      toast({ title: "Error", description: "Failed to complete the session.", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  }, [userLoading, userData, selectedDates, pollMediaItems, selectedFriends, sendNotification, createSession, sendInvitation, router]); // Removed unnecessary toast dependency

  const handleCancel = useCallback(() => { router.push('/watch-together'); }, [router]);

  // Updated input change handler
  const handleMediaInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setInputMediaTitle(term);
    setApiSearchResults([]); // Clear API results on input change
    setApiSearchError(null);
    if (term.trim() === '') {
      setWatchlistSuggestions([]);
      setActiveSuggestionSource(null);
    } else {
      const allWatchlistItems = [...friendsWatchlistItems.movie, ...friendsWatchlistItems.tv];
      const filtered = allWatchlistItems.filter(item =>
        (item.title || item.name)?.toLowerCase().includes(term.toLowerCase())
      );
      setWatchlistSuggestions(filtered);
      setActiveSuggestionSource('watchlist'); // Prioritize watchlist
    }
  }, [friendsWatchlistItems]);

  // Updated add function
  const addMediaItemToPollState = useCallback((item: FriendsWatchlistItem | SearchResult) => {
    const newMediaItem: MediaPollItem = {
      id: item.id,
      type: item.media_type === 'tv' ? 'tv' : 'movie',
      title: item.title || (item as SearchResult).name || 'Unknown Title',
      poster_path: item.poster_path || null,
      release_date: item.release_date || (item as SearchResult).first_air_date || null,
      vote_average: item.vote_average || null,
    };
    setPollMediaItems(prevItems => {
      if (prevItems.some(existingItem => existingItem.id === newMediaItem.id)) {
        toast({ title: "Already Added", description: `"${newMediaItem.title}" is already suggested.`, variant: "default" });
        return prevItems;
      }
      return [...prevItems, newMediaItem];
    });
    setInputMediaTitle('');
    setWatchlistSuggestions([]);
    setApiSearchResults([]);
    setActiveSuggestionSource(null);
  }, []); // Removed unnecessary toast dependency

  // Updated remove function
  const removeMediaItemFromPollState = useCallback((mediaId: number) => {
    setPollMediaItems(prevItems => prevItems.filter(item => item.id !== mediaId));
  }, []);

  const filteredFriends = useMemo(() => {
    if (!friends) return [];
    if (!friendSearchQuery.trim()) return friends;
    return friends.filter(friend =>
      friend.username.toLowerCase().includes(friendSearchQuery.toLowerCase())
    );
  }, [friends, friendSearchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Header Section (Unchanged) */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Create Watch Party</h2>
        <p className="text-sm text-foreground/60">Plan your perfect movie or TV show night with friends</p>
      </div>

      <div className="space-y-6">
        {/* Date Selection Section (Unchanged) */}
        <section className="frosted-panel p-4 sm:p-6 rounded-xl border border-foreground/10">
          <SectionHeader icon={<Calendar className="w-5 h-5" />} title="Select Date & Time" subtitle="Choose when you'd like to watch together" />
          <div className="rounded-xl overflow-hidden">
            <MovieNightCalendar selectedDates={selectedDates} onDatesSelected={handleDatesSelected} participants={{}} />
          </div>
          <div className="mt-2 text-xs text-foreground/60 flex items-center">
            <Badge variant="outline" className="mr-2 bg-pink/10 dark:bg-pink-dark/10 text-pink dark:text-pink-dark border-pink/20 dark:border-pink-dark/20">{selectedDates.length}</Badge>
            {selectedDates.length === 0 ? "No dates selected" : `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`}
          </div>
        </section>

        {/* Poll Creation Section (Updated) */}
        <section className="frosted-panel p-4 sm:p-6 rounded-xl border border-foreground/10">
          <SectionHeader icon={<div className="flex"><Film className="w-5 h-5" /><Tv className="w-5 h-5 -ml-1" /></div>} title="Create Watch Poll" subtitle="Add movies or TV shows for your friends to vote on" />
          <div className="space-y-4">
            <div ref={inputContainerRef} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                    value={inputMediaTitle}
                    onChange={handleMediaInputChange}
                    onFocus={() => {
                      if (!inputMediaTitle.trim()) {
                        const allWatchlistItems = [...friendsWatchlistItems.movie, ...friendsWatchlistItems.tv];
                        setWatchlistSuggestions(allWatchlistItems);
                        setActiveSuggestionSource('watchlist');
                      }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && inputMediaTitle.trim().length >= 2) { e.preventDefault(); handleApiSearch(); } }}
                    placeholder="Search watchlist or TMDB..."
                    className="input pr-10"
                  />
                  <Button
                    variant="ghost" size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/10"
                    onClick={handleApiSearch}
                    disabled={inputMediaTitle.trim().length < 2 || isApiSearching}
                    aria-label="Search TMDB"
                  >
                    {isApiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <AnimatePresence>
                {((activeSuggestionSource === 'watchlist' && watchlistSuggestions.length > 0) || activeSuggestionSource === 'search') && (
                  <motion.ul
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}
                    className="absolute w-full mt-1 rounded-xl list space-y-1 p-1 max-h-60 overflow-y-auto z-10" // Added z-10
                  >
                    {activeSuggestionSource === 'watchlist' && watchlistSuggestions.map((item) => (
                      <SuggestionItem key={`wl-${item.id}`} item={item} onClick={() => addMediaItemToPollState(item)} />
                    ))}
                    {activeSuggestionSource === 'search' && (
                      <>
                        {isApiSearching && <div className="px-3 py-2 text-xs text-foreground/60 flex items-center justify-center"><Loader2 size={14} className="animate-spin mr-2" /> Searching...</div>}
                        {apiSearchError && !isApiSearching && <div className="px-3 py-2 text-xs text-system-red">{apiSearchError}</div>}
                        {!isApiSearching && apiSearchResults.map((item) => (<SuggestionItem key={`sr-${item.id}`} item={item} onClick={() => addMediaItemToPollState(item)} />))}
                      </>
                    )}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {pollMediaItems.length > 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {pollMediaItems.map((item) => (<SelectedMediaItem key={item.id} item={item} onRemove={() => removeMediaItemFromPollState(item.id)} />))}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6 rounded-xl bg-foreground/5">
                  <div className="flex justify-center items-center gap-1"><Film className="w-6 h-6 text-foreground/30" /><Tv className="w-6 h-6 text-foreground/30" /></div>
                  <p className="text-sm text-foreground/50 mt-2">No titles added to poll yet</p>
                  <p className="text-xs text-foreground/40 mt-1">Search watchlist or TMDB to add suggestions</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Invite Friends Section (Unchanged) */}
        <section className="frosted-panel p-4 sm:p-6 rounded-xl border border-foreground/10">
          <SectionHeader icon={<Users className="w-5 h-5" />} title="Invite Friends" subtitle="Select friends to join your watch party" />
          {friends && friends.length > 6 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <input placeholder="Search friends..." value={friendSearchQuery} onChange={(e) => setFriendSearchQuery(e.target.value)} className="input pl-10" />
            </div>
          )}
          <AnimatePresence mode="wait">
            {isLoadingFriends ? ( <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-8"><div className="flex flex-col items-center space-y-2"><div className="relative w-8 h-8"><div className="absolute inset-0 rounded-full border-t-2 border-pink dark:border-pink-dark animate-spin"></div></div><p className="text-xs text-foreground/60">Loading friends...</p></div></motion.div>
            ) : filteredFriends && filteredFriends.length > 0 ? ( <motion.div key="friends-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">{filteredFriends.map(friend => (<FriendSelectionItem key={friend.uid} friend={friend} isSelected={selectedFriends.some(f => f.uid === friend.uid)} onToggle={() => toggleFriendSelection(friend)} />))}</motion.div>
            ) : friends && friends.length > 0 && friendSearchQuery ? ( <motion.div key="no-search-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6 bg-foreground/5 rounded-xl"><Search className="w-8 h-8 text-foreground/30 mx-auto mb-2" /><p className="text-sm text-foreground/50">No friends match your search</p><p className="text-xs text-foreground/40 mt-1">Try a different search term</p></motion.div>
            ) : ( <motion.div key="no-friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 bg-foreground/5 rounded-xl"><Users className="w-8 h-8 text-foreground/30 mx-auto mb-2" /><p className="text-sm text-foreground/50">No friends found</p><p className="text-xs text-foreground/40 mt-1">Add friends to invite them to watch parties</p></motion.div> )}
          </AnimatePresence>
          {friends && friends.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox id="sendNotification" checked={sendNotification} onCheckedChange={(checked: boolean) => setSendNotification(checked)} className="data-[state=checked]:bg-gray data-[state=checked]:border-gray" />
                <label htmlFor="sendNotification" className="text-xs text-foreground/70 cursor-pointer">Send notifications to invited friends</label>
              </div>
              <div className="text-xs text-foreground/60"><Badge variant="outline" className="bg-pink/10 dark:bg-pink-dark/10 text-pink dark:text-pink-dark border-pink/20 dark:border-pink-dark/20">{selectedFriends.length}</Badge> of {filteredFriends.length} friends selected</div>
            </div>
          )}
        </section>
      </div>

      {/* Action Buttons (Unchanged) */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <Button onClick={handleCancel} variant="ghost" className="w-full sm:w-auto text-foreground/70 hover:text-foreground hover:bg-foreground/10">Cancel</Button>
        <TooltipProvider><Tooltip><TooltipTrigger asChild>
              <Button onClick={completeSession} disabled={isCreating} className="w-full sm:w-auto bg-pink dark:bg-pink-dark hover:bg-pink/80 hover:dark:bg-pink-dark/80 text-white px-6 flex items-center justify-center gap-2">
                {isCreating ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Creating...</span></>) : (<><Send className="w-4 h-4" /><span>Create Session</span></>)}
              </Button>
        </TooltipTrigger><TooltipContent><p>Create your watch party session</p></TooltipContent></Tooltip></TooltipProvider>
      </div>
    </motion.div>
  );
}
