import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Film, Star, Calendar, Users, ThumbsUp, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTopWatchlist } from '@/context/TopWatchlistContext';
import Image from 'next/image';
import {
  handleInputChange,
  handleSuggestionClick,
  useOutsideClickHandler,
} from '@/utils/movieNightInvitationUtils';
import { useSession } from '@/context/SessionContext';
import { useUserData } from '@/context/UserDataContext';
import { TopWatchlistItem, Session, Poll } from '@/types';
import Link from 'next/link';

interface MoviePollProps {
  session: Session;
  poll: Poll;
}

const MoviePoll: React.FC<MoviePollProps> = ({ session, poll }) => {
  const [inputMovieTitle, setInputMovieTitle] = useState<string>(''); 
  const [suggestions, setSuggestions] = useState<TopWatchlistItem[]>([]); 
  const inputContainerRef = useRef<HTMLDivElement>(null);
  
  const { topWatchlistItems } = useTopWatchlist();
  const { toggleVote, addMovieToPoll, removeMovieFromPoll } = useSession();
  const { userData } = useUserData();

  // Hook for handling outside clicks
  useOutsideClickHandler(inputContainerRef, setSuggestions);

  const handleAddMovie = async () => {
    if (inputMovieTitle.trim() !== '') {
      await addMovieToPoll(session.id, inputMovieTitle.trim());
      setInputMovieTitle(''); // Clear input field after adding a movie
    }
  };

  const handleVote = async (movieTitle: string) => {
    try {
      await toggleVote(session.id, movieTitle);
    } catch (error) {
      console.error('Error toggling vote for movie:', error);
    }
  };

  const getVoteCount = (movieTitle: string) => {
    if (!poll) return 0;
    return Object.values(poll.votes).reduce(
      (count, userVotes) => count + (userVotes.includes(movieTitle) ? 1 : 0),
      0
    );
  };

  const hasVoted = (movieTitle: string) => {
    if (!poll || !userData) return false;
    const userVotes = poll.votes[userData.username] || [];
    return userVotes.includes(movieTitle);
  };

  const getMovieDetails = (title: string) => {
    return (
      topWatchlistItems.movie.find((item) => item.title === title) ||
      topWatchlistItems.tv.find((item) => item.name === title || item.title === title)
    );
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3 text-white flex items-center">
        <Film className="mr-2 text-primary/70" /> Movie Suggestions
      </h3>
      <div ref={inputContainerRef} className="flex flex-col space-y-2 mb-4 relative">
        <div className="flex flex-row items-center">
          <Input
            value={inputMovieTitle}
            onChange={(e) => handleInputChange(e, setInputMovieTitle, topWatchlistItems, setSuggestions)}
            placeholder="Suggest another movie"
            className="flex-grow text-white"
          />
          <Button onClick={handleAddMovie} className="ml-2">
            <Plus size={20} />
          </Button>
        </div>
        {suggestions.length > 0 && (
          <ul className="absolute z-10 bg-gradient-to-b from-gray-800 to-pink-900 w-full mt-1 text-white rounded-md shadow-lg top-full max-h-60 overflow-y-auto">
            {suggestions.map((movie) => (
              <li
                key={movie.id}
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
                onClick={() =>
                  handleSuggestionClick(
                    movie,
                    setInputMovieTitle,
                    [],
                    () => {},
                    setSuggestions,
                    async (title) => {
                      await addMovieToPoll(session.id, title);
                    }
                  )
                }
              >
                <Image
                  src={`https://image.tmdb.org/t/p/w92${movie.poster_path || ''}`}
                  alt={movie.title || ''}
                  width={32}
                  height={48}
                  className="object-cover mr-2"
                />
                <span>{movie.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-2">
        {poll.movieTitles.map((title: string, index: number) => {
          const voteCount = getVoteCount(title);
          const voted = hasVoted(title);
          const movieInfo = getMovieDetails(title);

          return (
            <motion.div
              key={index}
              className={`p-3 rounded-lg text-white flex items-center justify-between ${
                voted ? 'bg-pink-900/50' : 'bg-gray-800'
              } cursor-pointer`}
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              onClick={() => handleVote(title)}
            >
              <div className="flex items-center space-x-3">
              {movieInfo && movieInfo.poster_path && (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${movieInfo.poster_path}`}
                  alt={title}
                  width={60}
                  height={90}
                  className="object-cover rounded"
                />
              )}
              <div>
                <Link 
                  href={`/details/${movieInfo?.media_type || 'movie'}/${movieInfo?.id}`}
                  className="hover:text-primary transition-colors"
                  onClick={(e) => e.stopPropagation()} // Prevent vote toggle when clicking the link
                >
                  <h4 className="font-semibold text-lg">{title}</h4>
                </Link>
                  {movieInfo && (
                    <div className="text-xs text-gray-300 mt-1 flex flex-wrap items-center">
                      <span className="mr-3 flex items-center">
                        <Star className="w-3 h-3 mr-1 text-yellow-500" />
                        {movieInfo.vote_average?.toFixed(1) || 'N/A'}
                      </span>
                      <span className="mr-3 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {(() => {
                      const date = movieInfo.release_date || movieInfo.first_air_date;
                      return date ? format(new Date(date), 'yyyy') : 'Unknown';
                    })()}
                  </span>

                      <span className="mr-3 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {movieInfo.watchlist_count || 0} in watchlist
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className="text-sm font-medium flex items-center">
                  <ThumbsUp
                    className={`w-4 h-4 mr-1 ${voted ? 'text-pink-500' : 'text-white'}`}
                  />
                  <span className={voted ? 'text-pink-200 mr-1' : 'mr-1'}>
                    {voteCount}
                  </span>{' '}
                  vote{voteCount !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeMovieFromPoll(session.id, title);
                  }}
                >
                  Remove
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MoviePoll;