'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { DetailsData, VideoData, Media } from '@/types'; // Use Media type
import { format } from 'date-fns';
import { useUserData } from '@/context/UserDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Check, Film, Loader2 } from 'lucide-react'; // Import Loader2
import YouTubeEmbed from './YoutubeEmbed';
import HostEmbed from './HostEmbed' 
import DetailInfo from './DetailInfo'
import { Button } from '@/components/ui/button'

interface DetailPageWrapperProps {
  details: DetailsData;
  videos: VideoData[];
}

const DetailPageWrapper: React.FC<DetailPageWrapperProps> = ({ details, videos }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [showFlickyEmbed, setShowFlickyEmbed] = useState(false);
  // Get watchlistItems and loading state from useUserData
  const { watchlistItems, addToWatchlist, removeFromWatchlist, isLoading: isUserDataLoading } = useUserData();
  const [isProcessingWatchlist, setIsProcessingWatchlist] = useState(false);

  const isMovie = 'title' in details;
  const mediaType = isMovie ? 'movie' : 'tv';
  // Local state for immediate UI feedback
  const [localIsInWatchlist, setLocalIsInWatchlist] = useState(false);

  // Sync local state with watchlistItems from context
  useEffect(() => {
    if (watchlistItems && details?.id) {
      const items = watchlistItems[mediaType]; // Get the correct array (movie or tv)
      const contextIsInWatchlist = items?.some(item => item.id === details.id);
      setLocalIsInWatchlist(!!contextIsInWatchlist);
    } else {
      setLocalIsInWatchlist(false);
    }
    // Depend on watchlistItems object directly for changes
  }, [watchlistItems, details?.id, mediaType]);

  const title = isMovie ? details.title : details.name;
  const releaseDate = isMovie ? details.release_date : details.first_air_date;
  const formattedReleaseDate = releaseDate 
    ? format(new Date(releaseDate), 'dd MMMM yyyy')
    : 'N/A';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

  const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
  // We use localIsInWatchlist for the button state

  const handleWatchlistClick = async () => {
    // Use the context's isLoading flag as well
    if (isProcessingWatchlist || isUserDataLoading) return;

    setIsProcessingWatchlist(true);
    const currentMediaId = details.id; // Store id in case details change somehow

    try {
      if (localIsInWatchlist) {
        await removeFromWatchlist(currentMediaId, mediaType);
        setLocalIsInWatchlist(false);
      } else {
        // Construct the payload strictly conforming to the Media type
        const mediaPayload: Media & { addedAt: string } = {
          // Fields directly from Media type definition
          id: details.id,
          vote_average: details.vote_average, // Required in Media
          poster_path: details.poster_path, // Optional in Media
          overview: details.overview, // Optional in Media (assuming string is okay)
          genre_ids: details.genres?.map(g => g.id) || [], // Optional in Media

          // Conditionally add title/name based on mediaType
          ...(isMovie ? { title: details.title } : { name: details.name }),

          // Conditionally add release_date/first_air_date
          ...(isMovie ? { release_date: details.release_date } : { first_air_date: details.first_air_date }),

          // Add required fields for watchlist functionality
          media_type: mediaType,
          addedAt: new Date().toISOString(),
        };
        // Note: Fields like backdrop_path, popularity, vote_count, original_title/name, adult, video
        // are NOT part of the Media type and are intentionally omitted.

        await addToWatchlist(mediaPayload as Media, mediaType); // Pass the correctly typed payload
        setLocalIsInWatchlist(true);
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
      // Optionally: show a toast notification for the error
      // Revert local state on error? Depends on desired UX.
      // setLocalIsInWatchlist(!localIsInWatchlist);
    } finally {
      setIsProcessingWatchlist(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground pt-6">
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
              className="w-full lg:w-1/4 shrink-0 space-y-4"
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

              <div className="space-y-2">
                {trailer && (
                  <Button 
                    variant="secondary"
                    onClick={() => setShowTrailer(true)}
                    className="w-full h-12 rounded-xl"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Trailer
                  </Button>
                )}

                <Button
                  onClick={() => setShowFlickyEmbed(!showFlickyEmbed)} 
                  className="w-full bg-pink hover:bg-pink/90 text-white
                           border-0 h-12 rounded-xl"
                  aria-expanded={showFlickyEmbed}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {showFlickyEmbed ? 'Hide Player' : 'Watch Now'}
                </Button>

                <Button
                  onClick={handleWatchlistClick}
                  disabled={isProcessingWatchlist || isUserDataLoading}
                  className={`w-full h-12 rounded-xl flex items-center justify-center transition-colors duration-200 ${
                    localIsInWatchlist
                      ? 'bg-pink hover:bg-pink/90 text-white' // Style when added
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' // Style when not added
                  } ${isProcessingWatchlist ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {isProcessingWatchlist ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : localIsInWatchlist ? (
                    <Check className="w-5 h-5 mr-2" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2" />
                  )}
                  {isProcessingWatchlist
                    ? 'Processing...'
                    : localIsInWatchlist
                    ? 'In Watchlist'
                    : 'Add to Watchlist'}
                </Button>
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
