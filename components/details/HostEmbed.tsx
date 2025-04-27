'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { VidSrcEmbed, SToEmbed, MoviesApiClubEmbed } from './host-services';

const SERVER_OPTIONS = [
  { id: 'vidsrc', name: 'VidSrc', language: 'en' },
  { id: 'moviesapiclub', name: 'MoviesApi.Club', language: 'en' },
  { id: 's.to', name: 'S.to', language: 'de' },
] as const;

type ServerOption = {
  id: string;
  name: string;
  language: 'en' | 'de';
};

interface HostEmbedProps {
  tmdbId: number;
  title: string;
  mediaType: 'movie' | 'tv';
  initialData?: { 
    season: number;
    episode: number;
    totalSeasons?: number;
    seasons?: { season_number: number; episode_count: number }[]; 
  };
}

const ServerSelection: React.FC<{
  availableServers: ServerOption[];
  selectedServer: ServerOption;
  onServerChange: (serverId: string) => void;
}> = ({ availableServers, selectedServer, onServerChange }) => {
  const serversByLanguage = React.useMemo(() => {
    return availableServers.reduce((acc, server) => {
      const lang = server.language === 'en' ? 'English' : 'German';
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(server);
      return acc;
    }, {} as Record<string, ServerOption[]>);
  }, [availableServers]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-muted-foreground">Server</label>
        <span className="text-xs bg-pink text-white px-2 py-0.5 rounded-full">
          {selectedServer.language === 'en' ? '🇺🇸' : '🇩🇪'} {selectedServer.name}
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {Object.entries(serversByLanguage).map(([language, servers]) => (
          <div key={language}>
            <div className="text-xs text-muted-foreground mb-1.5 pl-1">{language}</div>
            <div className="flex flex-wrap gap-2">
              {servers.map(server => (
                <button
                  key={server.id}
                  onClick={() => onServerChange(server.id)}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-md border transition-all duration-200",
                    selectedServer.id === server.id
                      ? "bg-pink text-primary-foreground border-primary shadow-sm"
                      : "bg-background hover:bg-secondary/50 border-input"
                  )}
                >
                  {server.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HostEmbed: React.FC<HostEmbedProps> = ({
  tmdbId,
  title,
  mediaType,
  initialData,
}) => {
  const isTvShow = mediaType === 'tv' && !!initialData;
  const [selectedServer, setSelectedServer] = useState<ServerOption>(SERVER_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [currentSeason, setCurrentSeason] = useState(initialData?.season ?? 1);
  const [currentEpisode, setCurrentEpisode] = useState(initialData?.episode ?? 1);
  
  const availableServers = React.useMemo(() => {
    const allServers = [...SERVER_OPTIONS];
    if (mediaType === 'movie') {
      return allServers.filter(server => server.id !== 's.to');
    }
    return allServers;
  }, [mediaType]);

  useEffect(() => {
    if (!availableServers.find(server => server.id === selectedServer.id)) {
      setSelectedServer(availableServers[0] || SERVER_OPTIONS[0]); 
    }
  }, [availableServers, selectedServer.id]);
  
  const handleErrorChange = useCallback((error: string | null) => {
    setServiceError(error);
    setIsLoading(false); 
    setEmbedUrl(null);
  }, []);
  
  const handleUrlChange = useCallback((url: string | null) => {
    setEmbedUrl(url);
    setIsLoading(false); 
    if (url) {
      setServiceError(null);
    }
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setServiceError(null); 
  };
  
  const totalEpisodesInCurrentSeason = React.useMemo(() => {
    if (!isTvShow || !initialData?.seasons) return 0;
    const seasonData = initialData.seasons.find(s => s.season_number === currentSeason);
    return seasonData?.episode_count ?? 0;
  }, [isTvShow, initialData?.seasons, currentSeason]);

  const handleServerChange = (serverId: string) => {
    const newServer = SERVER_OPTIONS.find(s => s.id === serverId);
    if (newServer && newServer.id !== selectedServer.id) {
      setIsLoading(true); 
      setEmbedUrl(null);
      setServiceError(null);
      setSelectedServer(newServer);
    }
  };

  const handleSeasonChange = (value: string) => {
    const seasonNum = parseInt(value, 10);
    if (!isNaN(seasonNum) && seasonNum !== currentSeason) {
      setIsLoading(true); 
      setEmbedUrl(null);
      setServiceError(null);
      setCurrentSeason(seasonNum);
      setCurrentEpisode(1); 
    }
  };

  const handleEpisodeChange = (value: string) => {
    const episodeNum = parseInt(value, 10);
    if (!isNaN(episodeNum) && episodeNum !== currentEpisode) {
      setIsLoading(true); 
      setEmbedUrl(null);
      setServiceError(null);
      setCurrentEpisode(episodeNum);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border">
      <div className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col space-y-3">
        <ServerSelection 
          availableServers={availableServers}
          selectedServer={selectedServer}
          onServerChange={handleServerChange}
        />

        {isTvShow && initialData?.totalSeasons && initialData.totalSeasons > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Season</label>
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
        )}

        {isTvShow && initialData?.totalSeasons && initialData.totalSeasons > 0 && (
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Episode</label>
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
        )}

        {selectedServer.id === 'vidsrc' && (
          <VidSrcEmbed
            tmdbId={tmdbId}
            mediaType={mediaType}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            onUrlChange={handleUrlChange}
            onErrorChange={handleErrorChange}
            title={title} 
          />
        )}

        {selectedServer.id === 's.to' && (
          <SToEmbed
            tmdbId={tmdbId}
            title={title}
            mediaType={mediaType}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            onUrlChange={handleUrlChange} 
            onErrorChange={handleErrorChange}
          />
        )}

         {selectedServer.id === 'moviesapiclub' && (
           <MoviesApiClubEmbed
              tmdbId={tmdbId}
              title={title}
              mediaType={mediaType}
              currentSeason={currentSeason}
              currentEpisode={currentEpisode}
              onUrlChange={handleUrlChange} 
              onErrorChange={handleErrorChange}
           />
         )}

      </div>

      <div className="flex-grow relative aspect-video md:aspect-auto md:min-h-[80vh] bg-black rounded-md overflow-hidden border">
        <AnimatePresence>
          {isLoading && !serviceError && ( 
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

        {embedUrl && !serviceError ? (
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
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            {serviceError ? (
              <span className="text-destructive">{serviceError}</span>
            ) : !isLoading ? ( 
              <span className="text-muted-foreground">Select options to start watching.</span>
            ) : null 
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default HostEmbed;
