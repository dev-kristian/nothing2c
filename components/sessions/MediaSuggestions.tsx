import React, { useState, useRef, useMemo } from 'react'; 
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Film, Star, Calendar, Users, ThumbsUp, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFriendsWatchlist } from '@/context/FriendsWatchlistContext';
import Image from 'next/image';
import {
  handleInputChange,
  handleSuggestionClick,
  useOutsideClickHandler,
} from '@/utils/movieNightInvitationUtils';
import { useSession } from '@/context/SessionContext';
import { useUserData } from '@/context/UserDataContext';
import { FriendsWatchlistItem, Session, Poll } from '@/types';
import Link from 'next/link';

interface MediaSuggestionsProps {
  session: Session;
  poll: Poll | undefined;
  isReadOnly?: boolean;
}

const MediaSuggestions: React.FC<MediaSuggestionsProps> = ({ session, poll, isReadOnly = false }) => {
  const [inputMediaTitle, setInputMediaTitle] = useState<string>('');
  const [suggestions, setSuggestions] = useState<FriendsWatchlistItem[]>([]);
  const [showInput, setShowInput] = useState<boolean>(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const { friendsWatchlistItems } = useFriendsWatchlist();
  const { toggleVote, addMovieToPoll, removeMovieFromPoll } = useSession();
  const { userData } = useUserData();

  useOutsideClickHandler(inputContainerRef, () => {
    setSuggestions([]);
    if (inputMediaTitle.trim() === '') {
      setShowInput(false);
    }
  });

  const isSessionCreator = userData?.username === session.createdBy;

  const handleAddMedia = async () => {
    if (isReadOnly) return;
    if (inputMediaTitle.trim() !== '') {
      await addMovieToPoll(session.id, inputMediaTitle.trim());
      setInputMediaTitle('');
      setShowInput(false);
    }
  };

  const handleVote = async (mediaTitle: string) => {
    if (isReadOnly) return;
    try {
      await toggleVote(session.id, mediaTitle);
    } catch (error) {
      console.error('Error toggling vote for media:', error);
    }
  };

  const getVoteCount = (mediaTitle: string) => {
    if (!poll?.votes) return 0;
    return Object.values(poll.votes).reduce(
      (count, userVotes) => count + (userVotes?.includes(mediaTitle) ? 1 : 0),
      0
    );
  };

  const hasVoted = (mediaTitle: string) => {
    if (!poll?.votes || !userData?.username) return false;
    const userVotes = poll.votes[userData.username] || [];
    return userVotes.includes(mediaTitle);
  };

  const mediaDetailsMap = useMemo(() => {
    const map = new Map<string, FriendsWatchlistItem>();
    friendsWatchlistItems.movie.forEach(item => {
      if (item.title) map.set(item.title, item);
    });
    friendsWatchlistItems.tv.forEach(item => {
      if (item.name && !map.has(item.name)) map.set(item.name, item);
      if (item.title && !map.has(item.title)) map.set(item.title, item); 
    });
    return map;
  }, [friendsWatchlistItems]);

  const getMediaType = (mediaInfo: FriendsWatchlistItem | undefined): 'movie' | 'tv' => {
    if (!mediaInfo) return 'movie';
    if (mediaInfo.media_type === 'movie' || mediaInfo.media_type === 'tv') {
      return mediaInfo.media_type;
    }
    return mediaInfo.first_air_date ? 'tv' : 'movie';
  };

  const convertToFirestoreCompatible = (items: FriendsWatchlistItem[]): FriendsWatchlistItem[] => { 
    return items.map(item => ({
      ...item,
      media_type: item.media_type || (item.first_air_date ? 'tv' : 'movie') as 'movie' | 'tv',
      poster_path: item.poster_path || undefined,
      profile_path: undefined,
      weighted_score: item.weighted_score || 0
    }));
  };

  const getReleaseYear = (date: string | undefined) => {
    if (!date) return null;
    try {
      return format(new Date(date), 'yyyy');
    } catch { 
      console.error('Invalid date format:', date);
      return null;
    }
  };

  return (
    <div className="mt-6 frosted-panel p-6">
      <div className="flex items-center justify-between mb-5">
        <div ref={inputContainerRef} className="relative">
          {showInput ? (
            <div className="flex items-center">
              <Input
                value={inputMediaTitle}
                onChange={(e) => {
                  const compatibleItems = {
                    movie: convertToFirestoreCompatible(friendsWatchlistItems.movie),
                    tv: convertToFirestoreCompatible(friendsWatchlistItems.tv)
                  };
                  handleInputChange(e, setInputMediaTitle, compatibleItems, setSuggestions);
                }}
                onFocus={() => {
                  const allSuggestions = convertToFirestoreCompatible([
                    ...friendsWatchlistItems.movie, 
                    ...friendsWatchlistItems.tv
                  ]);
                  setSuggestions(allSuggestions);
                }}
                placeholder="Enter title..."
                className="w-60 text-sm rounded-full border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-md"
                autoFocus
                disabled={isReadOnly}
              />
              <Button
                onClick={handleAddMedia}
                className="ml-2 h-9 w-9 rounded-full p-0 bg-system-pink hover:bg-system-pink-dark text-white"
                disabled={isReadOnly || inputMediaTitle.trim() === ''}
              >
                <Plus size={16} />
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

          {suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full max-h-44 overflow-y-auto rounded-xl border border-gray-4 dark:border-white no-scrollbar shadow-apple dark:shadow-apple-dark bg-white dark:bg-gray-6-dark/90 backdrop-blur-md backdrop-saturate-150">
              {suggestions.map((media) => (
                <div
                  key={media.id}
                  className="px-4 py-2.5 hover:bg-system-pink/5 cursor-pointer flex items-center border-b border-separator/10 dark:border-separator-dark/10 last:border-b-0"
                  onClick={() => {
                    const compatibleMedia = {
                      ...media,
                      media_type: media.media_type || (media.first_air_date ? 'tv' : 'movie') as 'movie' | 'tv',
                      poster_path: media.poster_path || undefined
                    };

                    handleSuggestionClick(
                      compatibleMedia,
                      setInputMediaTitle,
                      [],
                      () => {},
                      setSuggestions,
                      async (title) => {
                        await addMovieToPoll(session.id, title);
                        setInputMediaTitle('');
                        setShowInput(false);
                      }
                    );
                  }}
                >
                  {media.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w92${media.poster_path}`}
                      alt={media.title || media.name || ''}
                      width={30}
                      height={45}
                      className="object-cover rounded-md mr-3"
                    />
                  ) : (
                    <div className="w-[30px] h-[45px] bg-gray-4 dark:bg-gray-4-dark rounded-md mr-3 flex items-center justify-center">
                      <Film size={16} className="text-gray-2 dark:text-gray-2-dark" />
                    </div>
                   )}
                   <div>
                     <p className="text-sm font-medium text-label dark:text-label-dark">
                       {media.title || media.name}
                     </p>
                     <div className="flex items-center text-xs text-label-secondary dark:text-label-secondary-dark">
                       <span>{media.media_type === 'tv' ? 'TV Show' : 'Movie'}</span>
                      {(media.release_date || media.first_air_date) && (
                        <span className="ml-2">
                          {getReleaseYear(media.release_date || media.first_air_date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Check if poll exists and has movieTitles before mapping */}
      {!poll?.movieTitles || poll.movieTitles.length === 0 ? (
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
          {poll?.movieTitles?.map((title: string, index: number) => {
            const voteCount = getVoteCount(title);
            const voted = hasVoted(title);
            const mediaInfo = mediaDetailsMap.get(title);
            const mediaType = getMediaType(mediaInfo);
            const releaseYear = mediaInfo ?
              getReleaseYear(mediaInfo.release_date || mediaInfo.first_air_date) : null;

            return (
              <motion.div
                key={`${title}-${index}`}
                className={`p-3 rounded-xl border ${
                  voted
                    ? 'bg-system-pink/5 dark:bg-system-pink-dark/10 border-system-pink/10 dark:border-system-pink-dark/10'
                    : 'bg-white/5 dark:bg-black/5 border-white/10 dark:border-white/5'
                } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'} transition-all duration-200 ${!isReadOnly ? 'hover:bg-white/10 dark:hover:bg-black/10' : ''}`}
                whileHover={!isReadOnly ? { scale: 1.005 } : {}}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                onClick={() => handleVote(title)}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4">
                    {mediaInfo && mediaInfo.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${mediaInfo.poster_path}`}
                        alt={title}
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
                        href={mediaInfo ? `/details/${mediaType}/${mediaInfo.id}` : '#'}
                        className="hover:text-system-pink dark:hover:text-system-pink-dark transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!mediaInfo) e.preventDefault();
                        }}
                      >
                        <h4 className="font-medium text-base text-label dark:text-label-dark">{title}</h4>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isReadOnly) {
                                removeMovieFromPoll(session.id, title);
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

                    {mediaInfo && (
                      <div className="text-xs text-label-secondary dark:text-label-secondary-dark mt-1.5 flex flex-wrap items-center">
                        {mediaInfo.vote_average !== undefined && (
                          <span className="mr-3 flex items-center">
                            <Star className="w-3 h-3 mr-1 text-yellow" />
                            {mediaInfo.vote_average.toFixed(1)}
                          </span>
                        )}

                        {releaseYear && (
                          <span className="mr-3 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {releaseYear}
                          </span>
                        )}

                        {mediaInfo.watchlist_count && mediaInfo.watchlist_count > 0 && (
                          <span className="mr-3 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {mediaInfo.watchlist_count} in watchlist
                          </span>
                        )}

                        <span className="flex items-center text-system-pink/70 dark:text-system-pink-dark/70 font-medium">
                          {mediaType === 'tv' ? 'TV Show' : 'Movie'}
                        </span>
                      </div>
                    )}
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
