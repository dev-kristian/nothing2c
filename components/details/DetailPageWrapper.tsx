'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { DetailsData, VideoData, Media } from '@/types';
import { format } from 'date-fns';
import { useAuthContext } from '@/context/AuthContext';
import { useAuthUser } from '@/context/AuthUserContext'; // Updated import
import { addUserWatchlistItem, removeUserWatchlistItem } from '@/utils/watchlistUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Film, Loader2 } from 'lucide-react'; // Removed Plus, Check
import { FaYoutube } from 'react-icons/fa'; // Added YouTube icon
import { CiBookmarkPlus, CiBookmarkMinus } from "react-icons/ci"; // Added Watchlist icons
import YouTubeEmbed from './YoutubeEmbed';
import HostEmbed from './HostEmbed'
import DetailInfo from './DetailInfo'
import { Button } from '@/components/ui/button'
import { SignInCTA_Modal } from '@/components/auth/SignInCTA_Modal'; 
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; 

interface DetailPageWrapperProps {
  details: DetailsData;
  videos: VideoData[];
}

const DetailPageWrapper: React.FC<DetailPageWrapperProps> = ({ details, videos }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [showFlickyEmbed, setShowFlickyEmbed] = useState(false);
  const { user } = useAuthContext(); // Get user from AuthContext
  const { userData, isLoading: isUserDataLoading } = useAuthUser(); // Use new hook
  const [isProcessingWatchlist, setIsProcessingWatchlist] = useState(false);

  const isMovie = 'title' in details;
  const mediaType = isMovie ? 'movie' : 'tv';
  // Local state for immediate UI feedback
  const [localIsInWatchlist, setLocalIsInWatchlist] = useState(false);

  // Sync local state with userData.watchlist from context
  useEffect(() => {
    if (userData?.watchlist && details?.id) {
      const items = userData.watchlist[mediaType] || []; // Get the correct array (movie or tv)
      const contextIsInWatchlist = items.some(item => item.id === details.id);
      setLocalIsInWatchlist(!!contextIsInWatchlist);
    } else {
      setLocalIsInWatchlist(false);
    }
    // Depend on userData object directly for changes
  }, [userData, details?.id, mediaType]);

  const title = isMovie ? details.title : details.name;
  const releaseDate = isMovie ? details.release_date : details.first_air_date;
  const formattedReleaseDate = releaseDate 
    ? format(new Date(releaseDate), 'dd MMMM yyyy')
    : 'N/A';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

  const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');

  const handleWatchlistClick = async () => {
    if (isProcessingWatchlist || isUserDataLoading) return;

    setIsProcessingWatchlist(true);
    const currentMediaId = details.id; 

    try {
      if (localIsInWatchlist) {
        await removeUserWatchlistItem(currentMediaId, mediaType);
      } else {
        const mediaPayload: Media = {
          id: details.id,
          vote_average: details.vote_average, 
          poster_path: details.poster_path, 
          overview: details.overview, 
          genre_ids: details.genres?.map(g => g.id) || [],

          ...(isMovie ? { title: details.title } : { name: details.name }),

          ...(isMovie ? { release_date: details.release_date } : { first_air_date: details.first_air_date }),

          media_type: mediaType,
        };
        await addUserWatchlistItem(mediaPayload, mediaType);
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
    } finally {
      setIsProcessingWatchlist(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground py-6">
      <div className="absolute inset-0 ">
        <Image
          src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
          alt={title || 'Backdrop'}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background/90 dark:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/70 dark:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-b from-black/90 via-black/70 to-black/90 dark:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-black via-black/80 to-black/70 dark:block" />
      </div>

      <div className="relative ">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:w-[450px] shrink-0 space-y-4"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl 
                            bg-card backdrop-blur-sm">
                {details.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w500${details.poster_path}`}
                    alt={title || 'Poster'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 25vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Film className="w-1/4 h-1/4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Button Container: Apply responsive layout */}
              <div className="flex flex-row space-x-2"> {/* Reverted space-x */}
                {trailer && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowTrailer(true)}
                    className="flex-1 px-3 py-2 md:px-4 md:w-full rounded-xl flex flex-row items-center justify-center" // Added flex-1 back
                  >
                    <FaYoutube className="w-5 h-5" />
                    <span className="text-xs ml-1.5 md:ml-2">Trailer</span>
                  </Button>
                )}

                <Button
                  onClick={() => setShowFlickyEmbed(!showFlickyEmbed)}
                  className="flex-1 px-3 py-2 md:px-4 md:w-full rounded-xl flex flex-row items-center justify-center bg-pink hover:bg-pink/90 text-white border-0" // Added flex-1 back
                  aria-expanded={showFlickyEmbed}
                >
                  <Play className="w-5 h-5" />
                  <span className="text-xs ml-1.5 md:ml-2">{showFlickyEmbed ? 'Player' : 'Watch Now'}</span>
                </Button>

                {user ? (
                  <Button
                    onClick={handleWatchlistClick}
                    disabled={isProcessingWatchlist || isUserDataLoading}
                    className={`flex-1 px-3 py-2 md:px-4 md:w-full rounded-xl flex flex-row items-center justify-center transition-colors duration-200 ${ // Added flex-1 back
                      localIsInWatchlist
                        ? 'bg-pink hover:bg-pink/90 text-white'
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    } ${isProcessingWatchlist ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {isProcessingWatchlist ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : localIsInWatchlist ? (
                      <CiBookmarkMinus className="w-5 h-5" />
                    ) : (
                      <CiBookmarkPlus className="w-5 h-5" />
                    )}
                    <span className="text-xs ml-1.5 md:ml-2">
                      {isProcessingWatchlist
                        ? 'Processing...'
                        : 'Bookmark'
                      }
                    </span>
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <SignInCTA_Modal>
                        <TooltipTrigger asChild>
                          <Button
                            disabled={false}
                            className={`flex-1 px-3 py-2 md:px-4 md:w-full rounded-xl flex flex-row items-center justify-center transition-colors duration-200 bg-secondary hover:bg-secondary/80 text-secondary-foreground`} // Added flex-1 back
                          >
                            <CiBookmarkPlus className="w-5 h-5" />
                            <span className="text-xs ml-1.5 md:ml-2">Bookmark</span>
                          </Button>
                        </TooltipTrigger>
                      </SignInCTA_Modal>
                      <TooltipContent
                        side="bottom"
                        className="bg-black/90 border-white/10 text-xs backdrop-blur-sm"
                      >
                        Sign in to add to Watchlist
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </motion.div>

            <div className="w-full lg:w-3/4 pb-8">
              {!showFlickyEmbed ? (
                <DetailInfo
                  title={title!}
                  releaseYear={releaseYear}
                  genres={details.genres.map(g => g.name).join(', ')}
                  voteAverage={details.vote_average}
                  voteCount={details.vote_count}
                  tagline={details.tagline}
                  overview={details.overview}
                  isMovie={isMovie}
                  runtime={isMovie ? details.runtime ?? 0 : details.episode_run_time?.[0] ?? 0}
                  language={details.spoken_languages?.[0]?.english_name || 'N/A'}
                  releaseDate={formattedReleaseDate}
                  seasons={!isMovie ? details.number_of_seasons : undefined}
                  episodes={!isMovie ? details.number_of_episodes : undefined}
                  budget={isMovie ? details.budget : undefined}
                  revenue={isMovie ? details.revenue : undefined}
                  status={details.status}
                />
              ) : (
                <HostEmbed
                  tmdbId={details.id}
                  title={title || ''}
                  mediaType={isMovie ? 'movie' : 'tv'} 
                  initialData={!isMovie ? {
                    season: 1,
                    episode: 1,
                    totalSeasons: details.number_of_seasons,
                    seasons: details.seasons
                  } : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTrailer && trailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 dark:bg-black/90 backdrop-blur-xl"
          >
            <YouTubeEmbed
              videoId={trailer.key}
              onClose={() => setShowTrailer(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DetailPageWrapper;
