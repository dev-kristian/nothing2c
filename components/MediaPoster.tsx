import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/context/AuthUserContext'; // Updated import
import { useAuthContext } from '@/context/AuthContext';
import { Media } from '@/types';
import { addUserWatchlistItem, removeUserWatchlistItem } from '@/utils/watchlistUtils';
import { Star, Film, Tv, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CiBookmarkPlus, CiBookmarkMinus } from "react-icons/ci";
import { Badge } from '@/components/ui/badge';
import { SignInCTA_Modal } from '@/components/auth/SignInCTA_Modal';

interface MediaPosterProps {
  media: Media;
  showMediaType?: boolean;
  variant?: 'default' | 'compact';
  showRank?: boolean;
  index?: number;
}

const MediaPoster: React.FC<MediaPosterProps> = ({
  media,
  showMediaType = false,
  variant = 'default',
  showRank = false,
  index,
}) => {
  const router = useRouter();
  const { user } = useAuthContext();
  // Use new hook, keep aliases for consistency within this file
  const { userData: contextUserData, isLoading: isUserDataLoading } = useAuthUser();
  const [isMutating, setIsMutating] = useState(false);

  const internalMediaType = (media.media_type === 'upcoming' ? 'movie' : media.media_type) as 'movie' | 'tv' | 'person';

  const [isInWatchlist, setIsInWatchlist] = useState(() => {
    if (user && contextUserData?.watchlist && (internalMediaType === 'movie' || internalMediaType === 'tv')) {
      const currentWatchlist = contextUserData.watchlist[internalMediaType] || [];
      return currentWatchlist.some(item => item.id === media.id);
    }
    return false;
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let shouldBeInWatchlist = false;
    if (user && contextUserData?.watchlist && (internalMediaType === 'movie' || internalMediaType === 'tv')) {
      const currentWatchlist = contextUserData.watchlist[internalMediaType] || [];
      shouldBeInWatchlist = currentWatchlist.some(item => item.id === media.id);
    }
    if (shouldBeInWatchlist !== isInWatchlist) {
      setIsInWatchlist(shouldBeInWatchlist);
    }
  }, [user, contextUserData, internalMediaType, media.id, isInWatchlist]);


  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMutating || isUserDataLoading || internalMediaType === 'person') return;

    setIsMutating(true);
    try {
      const mediaTypeForWatchlist = internalMediaType as 'movie' | 'tv';
      if (isInWatchlist) {
        await removeUserWatchlistItem(media.id, mediaTypeForWatchlist);
      } else {
        const { ...mediaToAdd } = media;
        await addUserWatchlistItem(mediaToAdd, mediaTypeForWatchlist);
      }
    } catch (error) {
      console.error('Error updating watchlist status:', error);
    } finally {
      setIsMutating(false);
    }
  };

  const handleCardClick = () => {
    const navigateToType = media.media_type === 'person' ? 'person' : internalMediaType;
    router.push(`/details/${navigateToType}/${media.id}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const title = media.title || media.name || 'Untitled';
  const imagePath = media.poster_path || media.profile_path;
  const releaseDate = media.release_date || media.first_air_date;
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : null;

  if (variant === 'compact') {
    return (
      <motion.div
        className="relative rounded-xl overflow-hidden shadow-apple dark:shadow-apple-dark cursor-pointer bg-black/20"
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={handleCardClick}
      >
        <div className="relative aspect-[2/3]">
          {imagePath && !imageError ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/w200${imagePath}`}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent">
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-xs font-semibold text-white line-clamp-1">{title}</h3>
                  {releaseYear && (
                    <p className="text-[11px] text-white/80 mt-0.5">{releaseYear}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-black/30 flex items-center justify-center">
              {internalMediaType === 'movie' ? (
                <Film className="w-8 h-8 text-white/40" />
              ) : internalMediaType === 'tv' ? (
                <Tv className="w-8 h-8 text-white/40" />
              ) : (
                <User className="w-8 h-8 text-white/40" />
              )}
              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="text-xs font-semibold text-white line-clamp-1">{title}</h3>
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-medium text-white">
              {media.vote_average?.toFixed(1)}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="group relative">
      {showRank && typeof index === 'number' && (
        <div className="absolute -top-3 -left-3 ">
          <Badge className="bg-gradient-to-r from-pink to-purple text-white shadow-glow px-3 py-1 rounded-full">
            #{index + 1}
          </Badge>
        </div>
      )}

      <motion.div
        className="relative overflow-hidden rounded-[20px] shadow-apple-lg cursor-pointer bg-neutral-900/5 border border-white/5"
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={handleCardClick}
      >
        <div className="relative aspect-[2/3]">
          {imagePath && !imageError ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/w500${imagePath}`}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={handleImageError}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-[15px] font-semibold text-white line-clamp-1">{title}</h3>
                  {releaseYear && (
                    <p className="text-[13px] text-white/80 mt-1">{releaseYear}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-neutral-900 flex flex-col items-center justify-center p-4">
              {internalMediaType === 'movie' ? (
                <Film className="w-10 h-10 text-white/40 mb-2" />
              ) : internalMediaType === 'tv' ? (
                <Tv className="w-10 h-10 text-white/40 mb-2" />
              ) : (
                <User className="w-10 h-10 text-white/40 mb-2" />
              )}
              <span className="text-white/60 text-xs text-center line-clamp-2">{title}</span>
              {releaseYear && (
                <span className="text-white/40 text-[11px] mt-1">{releaseYear}</span>
              )}
            </div>
          )}
          
          {media.vote_average > 0 && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <Star className={`w-3 h-3 ${media.vote_average >= 7 ? 'text-yellow-400 fill-yellow-400' : 'text-white/70'}`} />
              <span className="text-xs font-medium text-white">
                {media.vote_average?.toFixed(1)}
              </span>
            </div>
          )}

          {internalMediaType !== 'person' && (
            user ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWatchlist(e);
                      }}
                      disabled={isMutating || isUserDataLoading}
                      className={`
                        absolute right-0 bottom-0
                        w-12 h-8 rounded-tl-lg
                        flex items-center justify-center
                        shadow-lg transition-all duration-200
                        ${isInWatchlist 
                          ? 'bg-pink dark:bg-pink-dark backdrop-blur-md hover:dark:bg-pink/80'
                          : 'bg-white/10 backdrop-blur-md '
                        }
                        ${isMutating ? 'animate-pulse' : ''}
                        ${isUserDataLoading ? 'cursor-wait' : 'hover:bg-white/20'}
                      `}
                    >
                      {isMutating ? (
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
                      ) : isInWatchlist ? (
                        <CiBookmarkMinus className="w-6 h-6 text-white" />
                      ) : (
                        <CiBookmarkPlus className="w-6 h-6 text-white" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-black/90 border-white/10 text-xs backdrop-blur-sm"
                  >
                    {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <SignInCTA_Modal> 
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        disabled={false} 
                        className={`
                          absolute right-0 bottom-0
                          w-12 h-8 rounded-tl-lg
                          flex items-center justify-center 
                          shadow-lg transition-all duration-200
                          bg-white/10 backdrop-blur-md hover:bg-white/20
                        `}
                      >
                        <CiBookmarkPlus className="w-6 h-6 text-white" /> 
                      </button>
                    </TooltipTrigger>
                  </SignInCTA_Modal> 
                  <TooltipContent
                    side="right"
                    className="bg-black/90 border-white/10 text-xs backdrop-blur-sm"
                  >
                    Sign in to add to Watchlist
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          )}
        </div> 
      </motion.div>

      {showMediaType && media.media_type && (
        <div className="absolute top-2 left-2 bg-gray/50 dark:bg-gray-dark/50 backdrop-blur-sm rounded-full px-2 py-1 z-10">
          <span className="text-xs font-medium text-white uppercase tracking-wide">
            {media.media_type === 'movie' ? 'Movie' :
             media.media_type === 'tv' ? 'TV' :
             media.media_type === 'person' ? 'Person' :
             media.media_type === 'upcoming' ? 'Movie' : 
             null}
          </span>
        </div>
      )}
    </div> 
  );
};

export default React.memo(MediaPoster);
