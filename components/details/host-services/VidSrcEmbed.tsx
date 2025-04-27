'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HostServiceProps } from './types';

export const VIDSRC_DOMAINS = [
  'vidsrc.in',
  'vidsrc.pm',
  'vidsrc.xyz',
  'vidsrc.net'
];

const VidSrcEmbed: React.FC<HostServiceProps> = ({
  tmdbId,
  mediaType,
  currentSeason,
  currentEpisode,
  onUrlChange,
  onErrorChange, 
}) => {
  const [currentVidSrcDomain, setCurrentVidSrcDomain] = useState(VIDSRC_DOMAINS[0]);
  const isTvShow = mediaType === 'tv';

  const generateEmbedUrl = useCallback(() => {
    const baseUrl = `https://${currentVidSrcDomain}/embed/`;
    let newUrl: string | null = null;

    try {
      if (isTvShow) {
        if (typeof currentSeason === 'number' && currentSeason > 0 && typeof currentEpisode === 'number' && currentEpisode > 0) {
          newUrl = `${baseUrl}tv?tmdb=${tmdbId}&season=${currentSeason}&episode=${currentEpisode}`;
        } else {
          console.warn("VidSrcEmbed: Missing season or episode for TV show.");
          onErrorChange?.("Missing season or episode information for TV show.");
          return null;
        }
      } else { 
        newUrl = `${baseUrl}movie?tmdb=${tmdbId}`;
      }
      onErrorChange?.(null); 
      return newUrl;
    } catch (error) {
      console.error("Error generating VidSrc URL:", error);
      onErrorChange?.("Failed to generate VidSrc URL.");
      return null;
    }
  }, [currentVidSrcDomain, tmdbId, isTvShow, currentSeason, currentEpisode, onErrorChange]);

  useEffect(() => {
    const url = generateEmbedUrl();
    onUrlChange(url);
  }, [generateEmbedUrl, onUrlChange]); 

  const handleDomainCycle = (direction: 'next' | 'prev') => {
    const currentIndex = VIDSRC_DOMAINS.indexOf(currentVidSrcDomain);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % VIDSRC_DOMAINS.length
      : (currentIndex - 1 + VIDSRC_DOMAINS.length) % VIDSRC_DOMAINS.length;
    const newDomain = VIDSRC_DOMAINS[newIndex];
    setCurrentVidSrcDomain(newDomain);
  };

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">VidSrc Domain</label>
      <div className="flex items-center justify-between bg-muted p-1.5 rounded-md h-9">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDomainCycle('prev')}
          className="h-6 w-6 text-muted-foreground hover:bg-accent disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-foreground px-1 truncate flex-grow text-center" title={currentVidSrcDomain}>
          {currentVidSrcDomain}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDomainCycle('next')}
          className="h-6 w-6 text-muted-foreground hover:bg-accent disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default VidSrcEmbed;
