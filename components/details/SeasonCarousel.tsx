// components/SeasonCarousel.tsx
'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Season, SeasonDetails } from '@/types';
import SectionHeader from './SectionHeader';
import { Badge } from '@/components/ui/badge';

interface SeasonCarouselProps {
  seasons: Season[];
  tmdbId: number;
  fetchSeasonDetails: (formData: FormData) => Promise<SeasonDetails | null>;
}

const SeasonCarousel: React.FC<SeasonCarouselProps> = ({ 
  seasons, 
  fetchSeasonDetails 
}) => {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedSeasonDetails, setSelectedSeasonDetails] = useState<SeasonDetails | null>(null);

  const handleSeasonSelect = async (seasonNumber: number) => {
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

  const validSeasons = seasons.filter(season => season.episode_count > 0);

  return (
    <div className="w-full pb-8">
      <motion.div 
        className="w-full overflow-x-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }}
      >
        <SectionHeader title="Seasons" subtitle="Explore episodes season by season" />
        
        <div className="flex space-x-5 p-2 pb-4 px-4 snap-x snap-mandatory">
          {validSeasons.map((season) => (
            <motion.div
              key={season.id} 
              className={`flex-none w-44 snap-center cursor-pointer transition-all duration-300 ${
                selectedSeason === season.season_number ? 'scale-105' : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSeasonSelect(season.season_number)}
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-apple dark:shadow-apple-dark">
                {season.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${season.poster_path}`}
                    alt={season.name}
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                      selectedSeason !== null && selectedSeason !== season.season_number 
                        ? 'opacity-60 dark:opacity-40 saturate-50' 
                        : 'opacity-100 saturate-100'
                    }`}
                  />
                ) : (
                  <div className={`w-full h-full bg-muted flex items-center justify-center transition-all duration-300 ${
                    selectedSeason !== null && selectedSeason !== season.season_number 
                      ? 'opacity-60 dark:opacity-40' 
                      : 'opacity-100'
                  }`}>
                    <svg className="w-10 h-10 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {selectedSeason === season.season_number && (
                  <div className="absolute inset-0 border-2 border-pink rounded-2xl"></div>
                )}
              </div>
              
              <div className="mt-3 px-1">
                <h3 className="text-sm font-medium text-foreground truncate">{season.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{season.episode_count} episodes</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {selectedSeasonDetails && (
        <motion.div 
          className="mt-8 mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0], delay: 0.1 }}
        >
          <div className="rounded-2xl bg-system-background-tertiary dark:bg-system-background-tertiary-dark backdrop-blur-apple border border-border/50 dark:border-gray-800/40 overflow-hidden shadow-apple dark:shadow-apple-dark">
            <div className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-foreground">
                      {selectedSeasonDetails.name}
                    </h2>
                    <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 border-pink text-pink">
                      {selectedSeasonDetails.episodes.length} Episodes
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(selectedSeasonDetails.air_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5 text-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedSeasonDetails.overview}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {selectedSeasonDetails.episodes.map((episode) => (
              <motion.div
                key={episode.id}
                className="group relative rounded-xl bg-system-background-tertiary dark:bg-system-background-tertiary-dark  
                          transition-all duration-300 backdrop-blur-sm border border-border/30 dark:border-gray-800/30 
                          shadow-apple-sm dark:shadow-apple-dark-sm hover:shadow-apple dark:hover:shadow-apple-dark"
                whileHover={{ scale: 1.01, y: -2 }}
              >
                <div className="flex h-24 md:h-28">
                  <div className="relative w-40 md:w-48 overflow-hidden rounded-l-xl">
                    {episode.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                        alt={episode.name || `Episode ${episode.episode_number}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <svg className="w-8 h-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-pink/90 text-white text-xs backdrop-blur-sm">
                        Ep {episode.episode_number}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 p-4 flex flex-col  justify-between relative  ">
                    <div>
                      <div className="flex items-start  justify-between ">
                        <div>
                          <h4 className="text-sm font-medium text-foreground group-hover:text-pink transition-colors">
                            {episode.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
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
                        
                      </div>

                      <div className="relative mt-1 overflow-hidden ">
                        <p className="text-xs text-foreground/90  line-clamp-1 md:line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
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
    </div>
  );
};

export default SeasonCarousel;
