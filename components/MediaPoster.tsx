import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/context/UserDataContext';
import { Media } from '@/types';
import { Star, Film, Tv} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { shimmer, toBase64 } from '@/lib/image-shimmer';
import { CiBookmarkPlus, CiBookmarkMinus } from "react-icons/ci";
import { Badge } from '@/components/ui/badge';

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
  index
}) => {
  const router = useRouter();
  const { isLoading: isUserDataLoading, addToWatchlist, removeFromWatchlist, watchlistItems } = useUserData();
  const [isLoading, setIsLoading] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [imageError, setImageError] = useState(false);

  const mediaType = media.media_type as 'movie' | 'tv';

  useEffect(() => {
    if (watchlistItems && mediaType) {
      const isItemInWatchlist = watchlistItems[mediaType]?.some(item => item.id === media.id);
      setIsInWatchlist(isItemInWatchlist);
    }
  }, [watchlistItems, mediaType, media.id]);

  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading || isUserDataLoading) return;
    
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(media.id, mediaType);
      } else {
        await addToWatchlist({
          ...media,
          addedAt: new Date().toISOString()
        }, mediaType);
      }
    } catch (error) {
      console.error('Error updating watchlist status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    router.push(`/details/${media.media_type}/${media.id}`);
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
              <Image
                src={`https://image.tmdb.org/t/p/w200${imagePath}`}
                alt={title}
                fill
                sizes="150px"
                priority
                className="object-cover"
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(200, 300))}`}
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
              {mediaType === 'movie' ? (
                <Film className="w-8 h-8 text-white/40" />
              ) : (
                <Tv className="w-8 h-8 text-white/40" />
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
        <div className="absolute -top-3 -left-3 z-10">
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
              <Image
                src={`https://image.tmdb.org/t/p/w500${imagePath}`}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(500, 750))}`}
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
              {mediaType === 'movie' ? (
                <Film className="w-10 h-10 text-white/40 mb-2" />
              ) : (
                <Tv className="w-10 h-10 text-white/40 mb-2" />
              )}
              <span className="text-white/60 text-xs text-center line-clamp-2">{title}</span>
              {releaseYear && (
                <span className="text-white/40 text-[11px] mt-1">{releaseYear}</span>
              )}
            </div>
          )}
          
          {/* Rating Badge */}
          {media.vote_average > 0 && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <Star className={`w-3 h-3 ${media.vote_average >= 7 ? 'text-yellow-400 fill-yellow-400' : 'text-white/70'}`} />
              <span className="text-xs font-medium text-white">
                {media.vote_average?.toFixed(1)}
              </span>
            </div>
          )}

          {/* Watchlist Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleWatchlist}
                  disabled={isLoading || isUserDataLoading}
                  className={`
                    absolute right-0 bottom-0
                    w-12 h-8 rounded-tl-lg
                    flex items-center justify-center 
                    shadow-lg transition-all duration-200
                    ${isInWatchlist
                      ? 'bg-pink dark:bg-pink-dark backdrop-blur-md hover:dark:bg-pink/80'
                      : 'bg-white/10 backdrop-blur-md '
                    }
                    ${isLoading ? 'animate-pulse' : ''}
                    hover:bg-white/20
                  `}
                >
                  {isLoading ? (
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
        </div>
      </motion.div>

      {/* Media Type Indicator */}
      {showMediaType && media.media_type && (
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
          <span className="text-xs font-medium text-white uppercase tracking-wide">
            {media.media_type === 'movie' ? 'Movie' : 'TV'}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(MediaPoster);
