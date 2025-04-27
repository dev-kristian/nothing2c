'use client';
import React, { useEffect, useCallback } from 'react';
import { HostServiceProps } from './types';

const MoviesApiClubEmbed: React.FC<HostServiceProps> = ({
  tmdbId,
  mediaType,
  currentSeason,
  currentEpisode,
  onUrlChange,
  onErrorChange, 
}) => {
  const isTvShow = mediaType === 'tv';

  const generateEmbedUrl = useCallback(() => {
    const baseUrl = 'https://moviesapi.club/';
    let newUrl: string | null = null;

    try {
      if (isTvShow) {
        if (typeof currentSeason === 'number' && currentSeason > 0 && typeof currentEpisode === 'number' && currentEpisode > 0) {
          newUrl = `${baseUrl}tv/${tmdbId}-${currentSeason}-${currentEpisode}`;
        } else {
          console.warn("MoviesApiClubEmbed: Missing season or episode for TV show.");
          onErrorChange?.("Missing season or episode information for TV show."); 
          return null; 
        }
      } else { 
        newUrl = `${baseUrl}movie/${tmdbId}`;
      }
      onErrorChange?.(null);
      return newUrl;
    } catch (error) {
      console.error("Error generating MoviesApi.Club URL:", error);
      onErrorChange?.("Failed to generate MoviesApi.Club URL.");
      return null;
    }
  }, [tmdbId, isTvShow, currentSeason, currentEpisode, onErrorChange]);

  useEffect(() => {
    const url = generateEmbedUrl();
    onUrlChange(url);
  }, [generateEmbedUrl, onUrlChange]);

  return null;
};

export default MoviesApiClubEmbed;
