// components/HostEmbed.tsx
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIDSRC_DOMAINS = [
  'vidsrc.in',
  'vidsrc.pm',
  'vidsrc.xyz',
  'vidsrc.net'
];

// Keep only VidSrc
const SERVER_OPTIONS = [
  { id: 'vidsrc', name: 'VidSrc', domains: VIDSRC_DOMAINS },
];
const VIDSRC_SERVER = SERVER_OPTIONS[0]; // Constant for the only server

interface HostEmbedProps {
  tmdbId: number;
  initialData?: {
    season: number;
    episode: number;
    totalSeasons?: number;
    seasons?: { season_number: number; episode_count: number }[];
  };
}

const HostEmbed: React.FC<HostEmbedProps> = ({
  tmdbId,
  initialData,
}) => {
  const isTvShow = !!initialData;
  // No need for selectedServer state anymore, always use VIDSRC_SERVER
  const [currentVidSrcDomain, setCurrentVidSrcDomain] = useState(VIDSRC_DOMAINS[0]);
  // Removed isServerPopoverOpen state
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState('');

  const [currentSeason, setCurrentSeason] = useState(initialData?.season ?? 1);
  const [currentEpisode, setCurrentEpisode] = useState(initialData?.episode ?? 1);

  const generateEmbedUrl = useCallback(() => {
    const season = isTvShow ? currentSeason : undefined;
    const episode = isTvShow ? currentEpisode : undefined;

    // Only VidSrc logic remains
    const baseUrl = `https://${currentVidSrcDomain}/embed/`;
    if (isTvShow && season && episode) {
      return `${baseUrl}tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
    }
    return `${baseUrl}movie?tmdb=${tmdbId}`;
  }, [
    tmdbId,
    isTvShow,
    currentSeason,
    currentEpisode,
    // selectedServer removed from dependencies
    currentVidSrcDomain,
  ]);

  useEffect(() => {
    setIsLoading(true);
    const newUrl = generateEmbedUrl();
    setEmbedUrl(newUrl);
  }, [generateEmbedUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const totalEpisodesInCurrentSeason = React.useMemo(() => {
    if (!isTvShow || !initialData?.seasons) return 0;
    const seasonData = initialData.seasons.find(s => s.season_number === currentSeason);
    return seasonData?.episode_count ?? 0;
  }, [isTvShow, initialData?.seasons, currentSeason]);

  // Removed handleServerChange function

  const handleDomainCycle = (direction: 'next' | 'prev') => {
    setIsLoading(true);
    const currentIndex = VIDSRC_DOMAINS.indexOf(currentVidSrcDomain);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % VIDSRC_DOMAINS.length
      : (currentIndex - 1 + VIDSRC_DOMAINS.length) % VIDSRC_DOMAINS.length;
    setCurrentVidSrcDomain(VIDSRC_DOMAINS[newIndex]);
  };

  const handleSeasonChange = (value: string) => {
    const seasonNum = parseInt(value, 10);
    if (!isNaN(seasonNum)) {
      setIsLoading(true);
      setCurrentSeason(seasonNum);
      setCurrentEpisode(1);
    }
  };

  const handleEpisodeChange = (value: string) => {
    const episodeNum = parseInt(value, 10);
    if (!isNaN(episodeNum)) {
      setIsLoading(true);
      setCurrentEpisode(episodeNum);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border">
      {/* Left Column: Controls - Adjusted width for responsiveness */}
      <div className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col space-y-3">

        {/* Season and Episode Selection (for TV Shows) */}
        {isTvShow && initialData?.totalSeasons && (
          <>
            {/* Season Select */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Season</label>
              <Select
                value={currentSeason.toString()}
                onValueChange={handleSeasonChange}
              >
                <SelectTrigger className="w-full h-9 ">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: initialData.totalSeasons }, (_, i) => i + 1).map(seasonNum => (
                    <SelectItem key={seasonNum} value={seasonNum.toString()}>
                      Season {seasonNum}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Episode Select */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Episode</label>
              <Select
                value={currentEpisode.toString()}
                onValueChange={handleEpisodeChange}
                disabled={totalEpisodesInCurrentSeason === 0}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select episode" />
                </SelectTrigger>
                <SelectContent>
                  {totalEpisodesInCurrentSeason > 0 ? (
                    Array.from({ length: totalEpisodesInCurrentSeason }, (_, i) => i + 1).map(episodeNum => (
                      <SelectItem key={episodeNum} value={episodeNum.toString()}>
                        Episode {episodeNum}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-episodes" disabled>No episodes available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Server Selection Removed */}

        {/* VidSrc Domain Selection (Always shown now) */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">VidSrc Domain</label>
          <div className="flex items-center justify-between bg-muted p-1.5 rounded-md h-9">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDomainCycle('prev')}
                className="h-6 w-6 text-muted-foreground hover:bg-accent"
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
                className="h-6 w-6 text-muted-foreground hover:bg-accent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
      </div>

      {/* Right Column: Iframe Embed - Responsive height/aspect ratio */}
      <div className="flex-grow relative aspect-video md:aspect-auto md:min-h-[80vh] bg-black rounded-md overflow-hidden border">
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="animate-spin h-8 w-8 text-pink" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Embed Iframe */}
        {embedUrl ? (
          <iframe
            key={embedUrl}
            src={embedUrl}
            width="100%"
            height="100%"
            allowFullScreen
            onLoad={handleIframeLoad}
            className={cn(
              "absolute inset-0 w-full h-full border-none transition-opacity duration-300",
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            referrerPolicy="origin"
            sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            Select a server to start watching.
          </div>
        )}
      </div>
    </div>
  );
};

export default HostEmbed;
