// components/MediaPoster.tsx
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/context/UserDataContext';
import { Media } from '@/types';
import { BookmarkPlus, BookmarkMinus, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MediaPosterProps {
  media: Media;
  showMediaType?: boolean;
  variant?: 'default' | 'compact';
}

const MediaPoster: React.FC<MediaPosterProps> = ({
  media,
  showMediaType = false,
  variant = 'default'
}) => {
  const router = useRouter();
  const { isLoading: isUserDataLoading, addToWatchlist, removeFromWatchlist, watchlistItems } = useUserData();  // Destructure watchlistItems
  const [isLoading, setIsLoading] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  const mediaType = media.media_type as 'movie' | 'tv';

    useEffect(() => {
        if (watchlistItems && mediaType) {
            const isItemInWatchlist = watchlistItems[mediaType]?.some(item => item.id === media.id);
            setIsInWatchlist(isItemInWatchlist);
        }
    }, [watchlistItems, mediaType, media.id]);


  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(media.id, mediaType);
        // setIsInWatchlist(false); // No longer needed, handled by useEffect
      } else {
        const mediaDetails = {
          id: media.id,
          title: media.title || media.name || 'Unknown Title',
          poster_path: media.poster_path || null,
          release_date: media.release_date || media.first_air_date || '',
          vote_average: media.vote_average || 0,
          media_type: mediaType,
        };
        await addToWatchlist(mediaDetails, mediaType);
        // setIsInWatchlist(true); // No longer needed, handled by useEffect
      }
    } catch (error) {
      console.error('Error updating watchlist status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const title = media.title || media.name || 'Untitled';
  const imagePath = media.poster_path || media.profile_path;
  const releaseDate = media.release_date || media.first_air_date;

  const getScoreColor = useMemo(() => {
    const score = media.vote_average;
    if (score === undefined) return 'text-gray-400';
    if (score >= 7) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  }, [media.vote_average]);

  const handleClick = () => {
    router.push(`/details/${media.media_type}/${media.id}`);
  };

  const renderContent = () => {
    if (variant === 'compact') {
      return (
        <motion.div
          className="relative rounded-lg overflow-hidden shadow-md cursor-pointer"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          onClick={handleClick}
        >
          {imagePath ? (
            <Image
              src={`https://image.tmdb.org/t/p/w200${imagePath}`}
              alt={title}
              width={150}
              height={225}
              priority
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-foreground text-sm">No Image</span>
            </div>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div
        className="relative rounded-xl overflow-hidden shadow-lg bg-background-light cursor-pointer"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
        onClick={handleClick}
      >
        <div className="relative aspect-[2/3]">
          {imagePath ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${imagePath}`}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              className="rounded-t-xl object-cover"
            />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <span className="text-foreground text-lg">No Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

          <div className="absolute top-2 left-2 flex items-center space-x-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm`}>
              <span className={`text-sm font-bold ${getScoreColor}`}>
                {media.vote_average ? media.vote_average.toFixed(1) : 'N/A'}
              </span>
            </div>
            {showMediaType && media.media_type && (
              <span className="text-xs font-medium py-1 px-2 rounded bg-black/50 backdrop-blur-sm text-white">
                {media.media_type.toUpperCase()}
              </span>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h2 className="text-lg font-semibold text-white mb-1 line-clamp-2">{title}</h2>
            {releaseDate && (
              <span className="text-sm text-gray-300">
                {new Date(releaseDate).getFullYear()}
              </span>
            )}
          </div>
        </div>

        <div className="bg-black flex justify-between items-center px-2 py-1">
          <div className="flex items-center space-x-2">
            {media.watchlist_count !== undefined && media.watchlist_count > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="text-muted-foreground" />
                <span className="text-muted-foreground">{media.watchlist_count}</span>
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={handleToggleWatchlist}
                    disabled={isLoading || isUserDataLoading}
                    className={`p-2 rounded-full transition-colors duration-200`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isInWatchlist ? (
                      <BookmarkMinus className="w-6 h-6 text-primary" />
                    ) : (
                      <BookmarkPlus className="w-6 h-6 text-muted-foreground" />
                    )}
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>
                  {isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </motion.div>
    );
  };

  return renderContent();
};

export default MediaPoster;