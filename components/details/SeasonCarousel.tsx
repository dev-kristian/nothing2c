// components/SeasonCarousel.tsx
'use client'
import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import FlickyEmbed from '@/components/details/HostEmbed';
import { Season, SeasonDetails, SelectedEpisode } from '@/types';

interface SeasonCarouselProps {
  seasons: Season[];
  tmdbId: number;
  fetchSeasonDetails: (formData: FormData) => Promise<SeasonDetails | null>;
}

const SeasonCarousel: React.FC<SeasonCarouselProps> = ({ 
  seasons, 
  tmdbId,
  fetchSeasonDetails 
}) => {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedSeasonDetails, setSelectedSeasonDetails] = useState<SeasonDetails | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);

  const handleSeasonSelect = async (seasonNumber: number) => {
    // Toggle off if clicking the same season
    if (selectedSeason === seasonNumber) {
      setSelectedSeason(null);
      setSelectedSeasonDetails(null);
      return;
    }

    setSelectedSeason(seasonNumber);
    const formData = new FormData();
    formData.append('seasonNumber', seasonNumber.toString());
    
    try {
      const details = await fetchSeasonDetails(formData);
      setSelectedSeasonDetails(details);
    } catch (error) {
      console.error('Error selecting season:', error);
    }
  };

  const handleWatchNow = (seasonNumber: number, episodeNumber: number) => {
    const episode = selectedSeasonDetails?.episodes.find(
      ep => ep.episode_number === episodeNumber
    );
    
    setSelectedEpisode({
      seasonNumber,
      episodeNumber,
      seasonId: selectedSeasonDetails?.id || 0,
      episodeId: episode?.id || 0
    });
  };

  const handleCloseEmbed = () => {
    setSelectedEpisode(null);
  };

  const validSeasons = seasons.filter(season => season.episode_count > 0);
  const handleNavigateEpisode = (direction: 'next' | 'prev') => {
    if (!selectedEpisode || !selectedSeasonDetails) return;

    const currentIndex = selectedSeasonDetails.episodes.findIndex(
      ep => ep.episode_number === selectedEpisode.episodeNumber
    );

    if (direction === 'next' && currentIndex < selectedSeasonDetails.episodes.length - 1) {
      const nextEpisode = selectedSeasonDetails.episodes[currentIndex + 1];
      setSelectedEpisode({
        seasonNumber: selectedEpisode.seasonNumber,
        episodeNumber: nextEpisode.episode_number,
        seasonId: selectedSeasonDetails.id,
        episodeId: nextEpisode.id
      });
    } else if (direction === 'prev' && currentIndex > 0) {
      const prevEpisode = selectedSeasonDetails.episodes[currentIndex - 1];
      setSelectedEpisode({
        seasonNumber: selectedEpisode.seasonNumber,
        episodeNumber: prevEpisode.episode_number,
        seasonId: selectedSeasonDetails.id,
        episodeId: prevEpisode.id
      });
    }
  };
  return (
    <div className="w-full pb-4">
      <motion.div 
        className="w-full overflow-x-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          Seasons
        </h2>
        <div className="flex space-x-4 p-2">
          {validSeasons.map((season) => (
            <motion.div 
              key={season.id} 
              className="flex-none w-48 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSeasonSelect(season.season_number)}
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md">
                {season.poster_path ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${season.poster_path}`}
                    alt={season.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={`object-cover transition-opacity duration-300 ${
                      selectedSeason !== null && selectedSeason !== season.season_number 
                        ? 'opacity-30' 
                        : 'opacity-100'
                    }`}
                    priority
                  />
                ) : (
                  <div className={`w-full h-full bg-gray-700 flex items-center justify-center transition-opacity duration-300 ${
                    selectedSeason !== null && selectedSeason !== season.season_number 
                      ? 'opacity-30' 
                      : 'opacity-100'
                  }`}>
                    <span className="text-gray-400 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <h3 className="mt-2 text-sm font-semibold">{season.name}</h3>
              <p className="text-xs text-gray-400">{season.episode_count} episodes</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Season Details */}
      {selectedSeasonDetails && (
        <motion.div 
          className="mt-6 mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Season Header - More Compact */}
          <div className="rounded-xl bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-medium text-white">
                      {selectedSeasonDetails.name}
                    </h2>
                    <div className="text-xs text-gray-400">
                      {selectedSeasonDetails.episodes.length} Episodes
                    </div>
                  </div>

                  {/* Season Stats - Compact Row */}
                  <div className="flex gap-6 text-xs text-gray-400">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(selectedSeasonDetails.air_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {selectedSeasonDetails.episodes.reduce((acc, ep) => acc + (ep.runtime || 0), 0)} min total
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {(selectedSeasonDetails.episodes.reduce((acc, ep) => acc + ep.vote_average, 0) / selectedSeasonDetails.episodes.length).toFixed(1)} avg rating
                    </div>
                  </div>

                  {selectedSeasonDetails.overview && (
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {selectedSeasonDetails.overview}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Episodes List */}
          <div className="mt-6 space-y-3">
            {selectedSeasonDetails.episodes.map((episode) => (
              <motion.div 
                key={episode.id} 
                className="group relative rounded-lg bg-gray-900/30 hover:bg-gray-800/40 transition-all duration-300"
                whileHover={{ scale: 1.002 }}
              >
                <div className="flex h-24">
                  {/* Episode Thumbnail */}
                  <div className="relative w-40 overflow-hidden rounded-l-lg">
                    {episode.still_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                        alt={episode.name || `Episode ${episode.episode_number}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 px-2 py-1 bg-gradient-to-tr from-black/90 to-transparent text-xs font-medium text-white rounded-tr-lg">
                      {episode.episode_number}
                    </div>
                  </div>

                  {/* Episode Details */}
                  <div className="flex-1 p-3 flex flex-col justify-between relative">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-white group-hover:text-primary transition-colors">
                            {episode.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            <span>{new Date(episode.air_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}</span>
                            {episode.runtime && (
                              <>
                                <span>•</span>
                                <span>{episode.runtime}m</span>
                              </>
                            )}
                            {episode.vote_average > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center">
                                  <svg className="w-3 h-3 text-yellow-400 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  {episode.vote_average.toFixed(1)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleWatchNow(selectedSeasonDetails.season_number, episode.episode_number)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          <span className="text-xs font-medium">Watch</span>
                        </button>
                      </div>

                      {/* Episode Overview with Hover Effect */}
                      <div className="relative group/text mt-1">
                        <p className="text-xs text-gray-400 line-clamp-1 group-hover/text:line-clamp-none">
                          {episode.overview}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* FlickyEmbed Component */}
      {selectedEpisode && (
      <FlickyEmbed
      tmdbId={tmdbId}
      seasonNumber={selectedEpisode.seasonNumber}
      episodeNumber={selectedEpisode.episodeNumber}
      onClose={handleCloseEmbed}
      totalEpisodes={selectedSeasonDetails?.episodes.length}
      onNavigateEpisode={handleNavigateEpisode}
    />
      )}
    </div>
  );
};

export default SeasonCarousel;