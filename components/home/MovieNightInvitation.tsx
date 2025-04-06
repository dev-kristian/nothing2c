'use client'

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCustomToast } from '@/hooks/useToast';
import { useUserData } from '@/context/UserDataContext';
import { useSession } from '@/context/SessionContext';
import { useSendInvitation } from '@/hooks/useSendInvitation';
import MovieNightCalendar from './MovieNightCalendar';
import { DateTimeSelection, FriendsWatchlistItem, Friend } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriendsWatchlist } from '@/context/FriendsWatchlistContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Calendar, Film, Users, X, Plus, Send, Check, Search, Tv } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  handleAddMovieTitle,
  removeMovieTitle,
  handleInputChange,
  handleSuggestionClick,
  useOutsideClickHandler
} from '@/utils/movieNightInvitationUtils';

const SuggestionItem = React.memo(({ item, onClick }: { 
  item: FriendsWatchlistItem; 
  onClick: () => void 
}) => (
  <motion.li
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 5 }}
    className="px-2 py-2 bg-gray-5/50 dark:bg-gray-5-dark/80 hover:bg-gray-5 hover:dar:bg-gray-5-dark flex list-item-selectable cursor-pointer rounded-lg transition-colors duration-200"
    onClick={onClick}
  >
    {item.poster_path ? (
      <div className="w-8 h-12 rounded-md overflow-hidden mr-3 shadow-sm">
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
      <div className="w-8 h-12 bg-gray dark:bg-gray-dark rounded-md mr-3 flex items-center justify-center">
        {item.media_type === 'tv' ? (
          <Tv className="w-4 h-4 text-gray dark:text-gray-dark" />
        ) : (
          <Film className="w-4 h-4 text-gray dark:text-gray-dark" />
        )}
      </div>
    )}
    <div className="flex flex-col">
      <span className="text-sm font-medium">{item.title}</span>
      <span className="text-xs text-foreground/60">
        {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
      </span>
    </div>
  </motion.li>
));
SuggestionItem.displayName = "SuggestionItem"; 

const SelectedMediaItem = React.memo(({ 
  item, 
  onRemove 
}: { 
  item: FriendsWatchlistItem; 
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
          {item.media_type === 'tv' ? (
            <Tv className="w-4 h-4 text-foreground/40" />
          ) : (
            <Film className="w-4 h-4 text-foreground/40" />
          )}
        </div>
      )}
      <div className="flex flex-col overflow-hidden">
        <span className="text-sm font-medium truncate">{item.title}</span>
        <span className="text-xs text-foreground/60">
          {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
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
  const { showToast } = useCustomToast();
  const { userData, isLoading: userLoading, friends, isLoadingFriends } = useUserData();
  const { createSession, createPoll } = useSession();
  const { sendInvitation, error: invitationError } = useSendInvitation();
  const [selectedDates, setSelectedDates] = useState<DateTimeSelection[]>([]);
  const [sendNotification, setSendNotification] = useState(true);
  const [mediaTitles, setMediaTitles] = useState<FriendsWatchlistItem[]>([]);
  const [inputMediaTitle, setInputMediaTitle] = useState('');
  const { friendsWatchlistItems } = useFriendsWatchlist();
  const [suggestions, setSuggestions] = useState<FriendsWatchlistItem[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleDatesSelected = useCallback((dates: DateTimeSelection[]) => {
    setSelectedDates(dates);
  }, []);

  useOutsideClickHandler(inputContainerRef, setSuggestions);

  const toggleFriendSelection = useCallback((friend: Friend) => {
    setSelectedFriends(prev => {
      const isSelected = prev.some(f => f.uid === friend.uid);
      if (isSelected) {
        return prev.filter(f => f.uid !== friend.uid);
      } else {
        return [...prev, friend];
      }
    });
  }, []);

  const completeSession = useCallback(async () => {
    if (userLoading || !userData) {
      showToast("Error", "User data not available. Please try again.", "error");
      return;
    }
  
    try {
      setIsCreating(true);
      const newSession = await createSession(selectedDates, selectedFriends);
      
      if (mediaTitles.length > 0 && newSession) {
        await createPoll(newSession.id, mediaTitles.map(item => item.title || ''));
      }
  
      if (sendNotification && selectedFriends.length > 0) {
        await sendInvitation(selectedFriends, newSession.id);
        if (invitationError) throw new Error(invitationError);
      }
  
      showToast("Session Created", "Your watch party session has been created successfully!", "success");
  
      setSelectedDates([]);
      setMediaTitles([]);
      setSelectedFriends([]);
      router.push(`/watch-together/${newSession.id}`);
  
    } catch (error) {
      console.error('Error completing session:', error);
      showToast("Error", "Failed to complete the session. Please try again.", "error");
    } finally {
      setIsCreating(false);
    }
  }, [
    userLoading, 
    userData, 
    selectedDates, 
    mediaTitles, 
    selectedFriends, 
    sendNotification, 
    showToast, 
    createSession, 
    createPoll, 
    sendInvitation, 
    invitationError, 
    router
  ]);

  const handleCancel = useCallback(() => {
    router.push('/watch-together');
  }, [router]);

  const handleAddMedia = useCallback(() => {
    handleAddMovieTitle(inputMediaTitle, mediaTitles, setMediaTitles, setInputMediaTitle);
  }, [inputMediaTitle, mediaTitles]);

  const handleMediaInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e, setInputMediaTitle, friendsWatchlistItems, setSuggestions);
  }, [friendsWatchlistItems]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputMediaTitle.trim()) {
      e.preventDefault();
      handleAddMedia();
    }
  }, [inputMediaTitle, handleAddMedia]);

  // Filter friends based on search query
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
      {/* Header */}
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">Create Watch Party</h2>
        <p className="text-sm text-foreground/60">
          Plan your perfect movie or TV show night with friends
        </p>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        {/* Calendar section */}
        <section className="frosted-panel p-4 sm:p-6 rounded-xl border border-foreground/10">
          <SectionHeader 
            icon={<Calendar className="w-5 h-5" />} 
            title="Select Date & Time" 
            subtitle="Choose when you'd like to watch together"
          />
          <div className="rounded-xl overflow-hidden">
            <MovieNightCalendar 
              selectedDates={selectedDates} 
              onDatesSelected={handleDatesSelected}
            />
          </div>
          <div className="mt-2 text-xs text-foreground/60 flex items-center">
            <Badge variant="outline" className="mr-2 bg-pink/10 dark:bg-pink-dark/10 text-pink dark:text-pink-dark border-pink/20 dark:border-pink-dark/20">
              {selectedDates.length}
            </Badge>
            {selectedDates.length === 0 
              ? "No dates selected" 
              : `${selectedDates.length} date${selectedDates.length > 1 ? 's' : ''} selected`
            }
          </div>
        </section>

        {/* Media poll section */}
        <section className="frosted-panel p-4 sm:p-6 rounded-xl border border-foreground/10">
          <SectionHeader 
            icon={<div className="flex"><Film className="w-5 h-5" /><Tv className="w-5 h-5 -ml-1" /></div>} 
            title="Create Watch Poll" 
            subtitle="Add movies or TV shows for your friends to vote on"
          />
          
          <div className="space-y-4">
            <div ref={inputContainerRef} className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-grow ">
                <input 
                    value={inputMediaTitle} 
                    onChange={handleMediaInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search or enter title (movie or TV show)"
                    className="pr-10 input"
                  />
                  <button 
                    onClick={handleAddMedia}
                    disabled={!inputMediaTitle.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 icon-button"
                    aria-label="Add to poll"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-10 w-full mt-1 rounded-xl list space-y-2 p-2"
                  >
                    {suggestions.map((item) => (
                      <SuggestionItem
                        key={item.id}
                        item={item}
                        onClick={() => handleSuggestionClick(
                          item,
                          setInputMediaTitle,
                          mediaTitles,
                          setMediaTitles,
                          setSuggestions
                        )}
                      />
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            
            <AnimatePresence>
              {mediaTitles.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
                >
                  {mediaTitles.map((item, index) => (
                    <SelectedMediaItem
                      key={item.id || index}
                      item={item}
                      onRemove={() => removeMovieTitle(index, mediaTitles, setMediaTitles)}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-6 rounded-xl bg-foreground/5"
                >
                  <div className="flex justify-center items-center gap-1">
                    <Film className="w-6 h-6 text-foreground/30" />
                    <Tv className="w-6 h-6 text-foreground/30" />
                  </div>
                  <p className="text-sm text-foreground/50 mt-2">No titles added to poll yet</p>
                  <p className="text-xs text-foreground/40 mt-1">Search or enter movie/TV show titles above</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
        
        {/* Friends section */}
        <section className="frosted-panel p-4 sm:p-6 rounded-xl border border-foreground/10">
          <SectionHeader 
            icon={<Users className="w-5 h-5" />} 
            title="Invite Friends" 
            subtitle="Select friends to join your watch party"
          />
          
          {/* Friend search input */}
          {friends && friends.length > 6 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <input
                placeholder="Search friends..."
                value={friendSearchQuery}
                onChange={(e) => setFriendSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          )}
          
          <AnimatePresence mode="wait">
            {isLoadingFriends ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center py-8"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative w-8 h-8">
                    <div className="absolute inset-0 rounded-full border-t-2 border-pink dark:border-pink-dark animate-spin"></div>
                  </div>
                  <p className="text-xs text-foreground/60">Loading friends...</p>
                </div>
              </motion.div>
            ) : filteredFriends && filteredFriends.length > 0 ? (
              <motion.div
                key="friends-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1"
              >
                {filteredFriends.map(friend => (
                  <FriendSelectionItem
                    key={friend.uid}
                    friend={friend}
                    isSelected={selectedFriends.some(f => f.uid === friend.uid)}
                    onToggle={() => toggleFriendSelection(friend)}
                  />
                ))}
              </motion.div>
            ) : friends && friends.length > 0 && friendSearchQuery ? (
              <motion.div
                key="no-search-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 bg-foreground/5 rounded-xl"
              >
                <Search className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-foreground/50">No friends match your search</p>
                <p className="text-xs text-foreground/40 mt-1">Try a different search term</p>
              </motion.div>
            ) : (
              <motion.div
                key="no-friends"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 bg-foreground/5 rounded-xl"
              >
                <Users className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-foreground/50">No friends found</p>
                <p className="text-xs text-foreground/40 mt-1">Add friends to invite them to watch parties</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {friends && friends.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendNotification"
                  checked={sendNotification}
                  onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                  className="data-[state=checked]:bg-gray data-[state=checked]:border-gray"
                />
                <label htmlFor="sendNotification" className="text-xs text-foreground/70 cursor-pointer">
                  Send notifications to invited friends
                </label>
              </div>
              
              <div className="text-xs text-foreground/60">
                <Badge variant="outline" className="bg-pink/10 dark:bg-pink-dark/10 text-pink dark:text-pink-dark border-pink/20 dark:border-pink-dark/20">
                  {selectedFriends.length}
                </Badge> of {filteredFriends.length} friends selected
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
        <Button
          onClick={handleCancel}
          variant="ghost"
          className="w-full sm:w-auto text-foreground/70 hover:text-foreground hover:bg-foreground/10"
        >
          Cancel
        </Button>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={completeSession}
                disabled={isCreating}
                className="w-full sm:w-auto bg-pink dark:bg-pink-dark hover:bg-pink/80 hover:dark:bg-pink-dark/80 text-white px-6 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Create Session</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create your watch party session</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
