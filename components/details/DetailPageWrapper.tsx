'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { DetailsData, VideoData } from '@/types';
import { format } from 'date-fns';
import { useUserData } from '@/context/UserDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Check, Film } from 'lucide-react';
import YouTubeEmbed from './YoutubeEmbed'
import HostEmbed from './HostEmbed' // Use original name for clarity
import DetailInfo from './DetailInfo'
import { Button } from '@/components/ui/button'

interface DetailPageWrapperProps {
  details: DetailsData;
  videos: VideoData[];
}

const DetailPageWrapper: React.FC<DetailPageWrapperProps> = ({ details, videos }) => {
  const [showTrailer, setShowTrailer] = useState(false);
  const [showFlickyEmbed, setShowFlickyEmbed] = useState(false);
  const { userData, addToWatchlist, removeFromWatchlist } = useUserData();
  
  const isMovie = 'title' in details;
  const title = isMovie ? details.title : details.name;
  const releaseDate = isMovie ? details.release_date : details.first_air_date;
  const formattedReleaseDate = releaseDate 
    ? format(new Date(releaseDate), 'dd MMMM yyyy')
    : 'N/A';
  const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';

  const trailer = videos.find(video => video.type === 'Trailer' && video.site === 'YouTube');
  const isInWatchlist = userData?.watchlist[isMovie ? 'movie' : 'tv'][details.id.toString()];

  const handleWatchlistClick = () => {
    if (isInWatchlist) {
      removeFromWatchlist(details.id, isMovie ? 'movie' : 'tv');
    } else {
      addToWatchlist(details, isMovie ? 'movie' : 'tv');
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground pt-6">
      {/* Backdrop Image with Gradient */}
      <div className="absolute inset-0 ">
        <Image
          src={`https://image.tmdb.org/t/p/original${details.backdrop_path}`}
          alt={title || 'Backdrop'}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {/* Light theme gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background/90 dark:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/70 dark:hidden" />
        {/* Dark theme gradient */}
        <div className="absolute inset-0 hidden bg-gradient-to-b from-black/90 via-black/70 to-black/90 dark:block" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-black via-black/80 to-black/70 dark:block" />
      </div>

      {/* Main Content */}
      <div className="relative ">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
            {/* Left Column - Poster and Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:w-1/4 shrink-0 space-y-4"
            >
              {/* Poster */}
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

              {/* Action Buttons */}
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

                {/* Show Watch Now Button for both Movies and TV Shows */}
                <Button
                  onClick={() => setShowFlickyEmbed(!showFlickyEmbed)} // Toggle visibility
                  className="w-full bg-pink hover:bg-pink/90 text-white
                           border-0 h-12 rounded-xl"
                  aria-expanded={showFlickyEmbed}
                >
                  <Play className="w-5 h-5 mr-2" />
                  {showFlickyEmbed ? 'Hide Player' : 'Watch Now'}
                </Button>

                <Button
                  variant={isInWatchlist ? "outline" : "secondary"}
                  onClick={handleWatchlistClick}
                  className="w-full h-12 rounded-xl"
                >
                  {isInWatchlist ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      In Watchlist
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add to Watchlist
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* Right Column - Conditionally renders Details or Player */}
            <div className="w-full lg:w-3/4 pb-8">
              {/* Conditionally render DetailInfo or HostEmbed */}
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
                // Render HostEmbed for both Movies and TV Shows
                <HostEmbed
                  tmdbId={details.id}
                  // Pass initial season/episode and the seasons array for TV shows
                  initialData={!isMovie ? {
                    season: 1,
                    episode: 1,
                    totalSeasons: details.number_of_seasons,
                    seasons: details.seasons // Pass the seasons array
                  } : undefined}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlay for Trailer */}
      <AnimatePresence>
        {showTrailer && trailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 dark:bg-black/90 backdrop-blur-xl" // Ensure trailer modal is on top
          >
            <YouTubeEmbed
              videoId={trailer.key}
              onClose={() => setShowTrailer(false)}
            />
          </motion.div>
        )}
        {/* Removed HostEmbed from AnimatePresence */}
      </AnimatePresence>
    </div>
  );
};

export default DetailPageWrapper;
