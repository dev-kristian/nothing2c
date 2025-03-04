import React, { useState, useRef, useCallback, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useCustomToast } from '@/hooks/useToast';
import { useUserData } from '@/context/UserDataContext';
import { useSession } from '@/context/SessionContext';
import { useSendInvitation } from '@/hooks/useSendInvitation';
import MovieNightCalendar from './MovieNightCalendar';
import { DateTimeSelection, TopWatchlistItem, Friend } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiFilm, FiSend, FiX, FiUsers } from 'react-icons/fi';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTopWatchlist } from '@/context/TopWatchlistContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  handleAddMovieTitle,
  removeMovieTitle,
  handleInputChange,
  handleSuggestionClick,
  useOutsideClickHandler
} from '@/utils/movieNightInvitationUtils';

const SuggestionItem = memo(({ movie, onClick }: { 
  movie: TopWatchlistItem; 
  onClick: () => void 
}) => (
  <li
    className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
    onClick={onClick}
  >
    <Image 
      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
      alt={movie.title || ''}
      width={32}
      height={48}
      className="object-cover mr-2"
      loading="lazy"
    />
    <span>{movie.title}</span>
  </li>
));
SuggestionItem.displayName = "SuggestionItem"; 

const SelectedMovieItem = memo(({ 
  movie, 
  onRemove 
}: { 
  movie: TopWatchlistItem; 
  onRemove: () => void 
}) => (
  <motion.li
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="flex items-center justify-between bg-gradient-to-r from-gray-800 to-pink-900/50 p-2 rounded-xl"
  >
    <div className="flex items-center">
      <Image 
        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
        alt={movie.title || ''}
        width={32}
        height={48}
        className="object-cover mr-2"
        loading="lazy"
      />
      <span className="text-gray-300 truncate">{movie.title}</span>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={onRemove}
      className="text-gray-400 hover:text-white"
    >
      <FiX />
    </Button>
  </motion.li>
));
SelectedMovieItem.displayName = "SelectedMovieItem";

const FriendSelectionItem = memo(({ friend, isSelected, onToggle }: { 
  friend: Friend; 
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`flex items-center justify-between p-3 rounded-lg mb-2 cursor-pointer ${
      isSelected ? 'bg-gradient-to-r from-pink-900/50 to-gray-800 border border-pink-500/30' : 'bg-gray-800 hover:bg-gray-700'
    }`}
    onClick={onToggle}
  >
    <div className="flex items-center">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mr-3">
        {friend.username.charAt(0).toUpperCase()}
      </div>
      <span>{friend.username}</span>
    </div>
    <Checkbox checked={isSelected} onCheckedChange={() => onToggle()} />
  </motion.div>
));
FriendSelectionItem.displayName = "FriendSelectionItem";

export default function MovieNightInvitation() {
  const router = useRouter();
  const { showToast } = useCustomToast();
  const { userData, isLoading: userLoading, friends, isLoadingFriends } = useUserData();
  const { createSession, createPoll } = useSession();
  const { sendInvitation, error: invitationError } = useSendInvitation();
  const [selectedDates, setSelectedDates] = useState<DateTimeSelection[]>([]);
  const [sendNotification, setSendNotification] = useState(true);
  const [movieTitles, setMovieTitles] = useState<TopWatchlistItem[]>([]);
  const [inputMovieTitle, setInputMovieTitle] = useState('');
  const { topWatchlistItems } = useTopWatchlist();
  const [suggestions, setSuggestions] = useState<TopWatchlistItem[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const inputContainerRef = useRef<HTMLDivElement>(null);

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
      const newSession = await createSession(selectedDates, selectedFriends);
      
      if (movieTitles.length > 0 && newSession) {
        await createPoll(newSession.id, movieTitles.map(movie => movie.title || ''));
      }
  
      if (sendNotification && selectedFriends.length > 0) {
        await sendInvitation(selectedFriends, newSession.id);
        if (invitationError) throw new Error(invitationError);
      }
  
      showToast("Session Created", "Your movie night session has been created successfully!", "success");
  
      setSelectedDates([]);
      setMovieTitles([]);
      setSelectedFriends([]);
      router.push(`/watch-together/${newSession.id}`);
  
    } catch (error) {
      console.error('Error completing session:', error);
      showToast("Error", "Failed to complete the session. Please try again.", "error");
    }
  }, [userLoading, userData, selectedDates, movieTitles, selectedFriends, sendNotification, 
    showToast, createSession, createPoll, sendInvitation, invitationError, router]);
  const handleCancel = useCallback(() => {
    router.push('/watch-together');
  }, [router]);

  const handleAddMovie = useCallback(() => {
    handleAddMovieTitle(inputMovieTitle, movieTitles, setMovieTitles, setInputMovieTitle);
  }, [inputMovieTitle, movieTitles]);

  const handleMovieInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e, setInputMovieTitle, topWatchlistItems, setSuggestions);
  }, [topWatchlistItems]);

  const sessionCreationContent = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="bg-transparent md:p-4 rounded-lg flex flex-col lg:flex-row lg:space-x-4">
        <div className="lg:w-2/3 mb-4 lg:mb-0">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FiCalendar className="mr-2" /> Select Date(s) (Optional)
          </h3>
          <MovieNightCalendar 
            selectedDates={selectedDates} 
            onDatesSelected={handleDatesSelected}
          />
        </div>
        
        <div className="lg:w-1/3">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <FiFilm className="mr-2" /> Create Movie Poll (Optional)
          </h3>
          <div ref={inputContainerRef} className="flex flex-col space-y-2 mb-4 relative">
            <div className="flex flex-row items-center">
              <Input 
                value={inputMovieTitle} 
                onChange={handleMovieInputChange}
                placeholder="Enter movie title"
                className="flex-grow"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={handleAddMovie}
                      className="bg-transparent hover:bg-transparent text-primary/70 md:text-white hover:text-primary/50 shadow-none"
                    >
                      Add Movie
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className='bg-primary/50'>
                    <p>Add movie to the poll</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {suggestions.length > 0 && (
              <ul className="absolute z-10 bg-gradient-to-b from-gray-800 to-pink-900 w-full mt-1 rounded-md shadow-lg top-full max-h-60 overflow-y-auto">
                {suggestions.map((movie) => (
                  <SuggestionItem
                    key={movie.id}
                    movie={movie}
                    onClick={() => handleSuggestionClick(
                      movie,
                      setInputMovieTitle,
                      movieTitles,
                      setMovieTitles,
                      setSuggestions
                    )}
                  />
                ))}
              </ul>
            )}
          </div>
          <AnimatePresence>
            {movieTitles.length > 0 && (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-2 mt-4"
              >
                {movieTitles.map((movie, index) => (
                  <SelectedMovieItem
                    key={movie.id}
                    movie={movie}
                    onRemove={() => removeMovieTitle(index, movieTitles, setMovieTitles)}
                  />
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Friend Selection Section */}
      <div className="bg-transparent md:p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FiUsers className="mr-2" /> Invite Friends
        </h3>
        
        {isLoadingFriends ? (
          <div className="flex justify-center py-4">
            <div className="animate-pulse flex space-x-4">
              <div className="h-12 bg-gray-700 rounded w-full"></div>
            </div>
          </div>
        ) : friends && friends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map(friend => (
              <FriendSelectionItem
                key={friend.uid}
                friend={friend}
                isSelected={selectedFriends.some(f => f.uid === friend.uid)}
                onToggle={() => toggleFriendSelection(friend)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            <p>You don't have any friends yet. Add friends to invite them to movie nights!</p>
          </div>
        )}
      </div>
  
      <div className="bg-transparent p-2 md:p-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="sendNotification"
            checked={sendNotification}
            onCheckedChange={(checked) => setSendNotification(checked as boolean)}
          />
                    <label htmlFor="sendNotification" className="text-sm font-medium">
            Send notification to invited users
          </label>
        </div>
      </div>
  
      <div className="flex justify-between items-center mt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
            <Button 
                onClick={handleCancel}
                className="py-6 text-lg font-semibold bg-transparent hover:bg-transparent text-white hover:text-primary/70 transition-all duration-300"
              >
                Cancel
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancel session creation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
  
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={completeSession} 
                className="py-6 text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 hover:bg-gradient-to-r hover:from-purple-300 hover:to-pink-500 shadow-none transition-all duration-300"
              >
                <FiSend className="mr-2 text-primary/50" /> Start Session
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create the movie night session</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </motion.div>
  ), [
    inputMovieTitle, 
    suggestions, 
    movieTitles, 
    sendNotification, 
    handleMovieInputChange, 
    handleAddMovie, 
    completeSession, 
    selectedDates, 
    handleDatesSelected, 
    handleCancel,
    friends,
    isLoadingFriends,
    selectedFriends,
    toggleFriendSelection
  ]); 

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 rounded-3xl shadow-2xl mx-auto border border-white/10 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {sessionCreationContent}
      </motion.div>
    </div>
  );
}
