'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { DetailsData, VideoData } from '@/types';
import { format } from 'date-fns';
import { useUserData } from '@/context/UserDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Check, Film } from 'lucide-react';
import YouTubeEmbed from './YoutubeEmbed';
import FlickyEmbed from './HostEmbed';
import DetailInfo from './DetailInfo';
import { Button } from '@/components/ui/button';

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
    <div className="relative min-h-screen bg-black text-white pt-6">
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
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
                            bg-white/5 backdrop-blur-sm">
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
                    <Film className="w-1/4 h-1/4 text-white/20" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {trailer && (
                  <Button 
                    onClick={() => setShowTrailer(true)}
                    className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm
                             text-white border-0 h-12 rounded-xl"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Trailer
                  </Button>
                )}

                {isMovie && (
                  <Button 
                    onClick={() => setShowFlickyEmbed(true)}
                    className="w-full bg-primary hover:bg-primary/90 text-white 
                             border-0 h-12 rounded-xl"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Watch Now
                  </Button>
                )}

                <Button 
                  onClick={handleWatchlistClick}
                  className={`w-full h-12 rounded-xl border-2 ${
                    isInWatchlist 
                      ? 'bg-white/5 hover:bg-white/10 border-white/20' 
                      : 'bg-white/10 hover:bg-white/20 border-transparent'
                  }`}
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

            {/* Right Column - Details */}
            <div className="w-full lg:w-3/4 pb-8">
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
            </div>
          </div>
        </div>
      </div>

      {/* Modal Overlays */}
      <AnimatePresence>
        {showTrailer && trailer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0  bg-black/90 backdrop-blur-xl"
          >
            <YouTubeEmbed 
              videoId={trailer.key} 
              onClose={() => setShowTrailer(false)} 
            />
          </motion.div>
        )}

        {showFlickyEmbed && isMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0  bg-black/90 backdrop-blur-xl"
          >
            <FlickyEmbed 
              tmdbId={details.id} 
              onClose={() => setShowFlickyEmbed(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DetailPageWrapper;