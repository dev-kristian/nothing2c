// components/HostEmbed.tsx
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
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from "@/hooks/use-toast";

const VIDSRC_DOMAINS = [
  'vidsrc.in',
  'vidsrc.pm',
  'vidsrc.xyz',
  'vidsrc.net'
];

const SERVER_OPTIONS = [
  { id: 'vidsrc', name: 'VidSrc', domains: VIDSRC_DOMAINS },
  { id: 's.to', name: 'S.to', domains: [] }, 
];

interface SToLink {
  hoster: string;
  url: string;
}

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

const HostEmbed: React.FC<HostEmbedProps> = ({
  tmdbId,
  title,
  mediaType,
  initialData,
}) => {
  const isTvShow = mediaType === 'tv' && !!initialData;
  const [selectedServer, setSelectedServer] = useState(SERVER_OPTIONS[0]); 
  const [currentVidSrcDomain, setCurrentVidSrcDomain] = useState(VIDSRC_DOMAINS[0]);
  const [isLoading, setIsLoading] = useState(true); 
  const [embedUrl, setEmbedUrl] = useState(''); 

  const [sToLinks, setSToLinks] = useState<SToLink[]>([]);
  const [selectedSToLink, setSelectedSToLink] = useState<SToLink | null>(null);
  const [isSToLoading, setIsSToLoading] = useState(false); 
  const [sToError, setSToError] = useState<string | null>(null);

  const [currentSeason, setCurrentSeason] = useState(initialData?.season ?? 1);
  const [currentEpisode, setCurrentEpisode] = useState(initialData?.episode ?? 1);

  const constructSToUrl = useCallback(() => {
    if (!title) return null;
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

    if (isTvShow) {
      if (currentSeason === undefined || currentEpisode === undefined) return null;
      return `https://s.to/serie/stream/${slug}/staffel-${currentSeason}/episode-${currentEpisode}`;
    } else {
      return `https://s.to/film/stream/${slug}`;
    }
  }, [title, isTvShow, currentSeason, currentEpisode]);

  const fetchSToLinks = useCallback(async () => {
    const sToUrl = constructSToUrl();
    if (!sToUrl) {
      setSToError("Could not construct S.to URL (missing title or season/episode info?).");
      setIsLoading(false); 
      return;
    }

    setIsSToLoading(true);
    setIsLoading(true); 
    setSToError(null);
    setSToLinks([]);
    setSelectedSToLink(null);
    setEmbedUrl('');

    try {
      const response = await fetch(`/api/german-host?url=${encodeURIComponent(sToUrl)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data.links && data.links.length > 0) {
        setSToLinks(data.links);
        setSelectedSToLink(data.links[0]); 
        setEmbedUrl(data.links[0].url);
        toast({ title: "S.to Links Found", description: `Found ${data.links.length} stream options.` });
      } else {
        setSToError('No stream links found on S.to for this selection.');
        setSToLinks([]);
        toast({ title: "S.to Links", description: "No stream options found for this selection.", variant: "destructive" });
      }
    } catch (error: unknown) {
      console.error("Error fetching S.to links:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching S.to links.';
      setSToError(errorMessage);
      setSToLinks([]);
      toast({ title: "Error Fetching S.to", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSToLoading(false);
      setIsLoading(false);
    }
  }, [constructSToUrl]);


  const generateEmbedUrl = useCallback(() => {
    if (selectedServer.id !== 'vidsrc') {
      return ''; 
    }

    const baseUrl = `https://${currentVidSrcDomain}/embed/`;
    if (isTvShow && currentSeason && currentEpisode) {
      return `${baseUrl}tv?tmdb=${tmdbId}&season=${currentSeason}&episode=${currentEpisode}`;
    }
    return `${baseUrl}movie?tmdb=${tmdbId}`;
  }, [
    tmdbId,
    isTvShow,
    currentSeason,
    currentEpisode,
    currentVidSrcDomain,
    selectedServer.id
  ]);

  useEffect(() => {
    setIsLoading(true); 
    setSToError(null);

    if (selectedServer.id === 'vidsrc') {
      const newUrl = generateEmbedUrl();
      setEmbedUrl(newUrl);
    } else if (selectedServer.id === 's.to') {
      fetchSToLinks(); 
    } else {
      setEmbedUrl('');
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServer, currentSeason, currentEpisode, currentVidSrcDomain]); 

  const handleIframeLoad = () => {
    if (selectedServer.id === 'vidsrc' || (selectedServer.id === 's.to' && selectedSToLink)) {
       setIsLoading(false);
    }
  };

  const totalEpisodesInCurrentSeason = React.useMemo(() => {
    if (!isTvShow || !initialData?.seasons) return 0;
    const seasonData = initialData.seasons.find(s => s.season_number === currentSeason);
    return seasonData?.episode_count ?? 0;
  }, [isTvShow, initialData?.seasons, currentSeason]);

  const handleServerChange = (serverId: string) => {
    const newServer = SERVER_OPTIONS.find(s => s.id === serverId);
    if (newServer && newServer.id !== selectedServer.id) {
      setSelectedServer(newServer);
      if (newServer.id === 'vidsrc') {
        setSToLinks([]);
        setSelectedSToLink(null);
        setSToError(null);
      } else {
      }
      setIsLoading(true); 
      setEmbedUrl(''); 
    }
  };

  const handleDomainCycle = (direction: 'next' | 'prev') => {
    if (selectedServer.id !== 'vidsrc' || !selectedServer.domains?.length) return; 
    const currentIndex = selectedServer.domains.indexOf(currentVidSrcDomain);
    const newIndex = direction === 'next'
      ? (currentIndex + 1) % selectedServer.domains.length
      : (currentIndex - 1 + selectedServer.domains.length) % selectedServer.domains.length;
    setCurrentVidSrcDomain(selectedServer.domains[newIndex]);
  };

  const handleSeasonChange = (value: string) => {
    const seasonNum = parseInt(value, 10);
    if (!isNaN(seasonNum) && seasonNum !== currentSeason) {
      setIsLoading(true); 
      setCurrentSeason(seasonNum);
      setCurrentEpisode(1); 
      setSToLinks([]);
      setSelectedSToLink(null);
      setSToError(null);
      setEmbedUrl(''); 
    }
  };

  const handleEpisodeChange = (value: string) => {
    const episodeNum = parseInt(value, 10);
    if (!isNaN(episodeNum) && episodeNum !== currentEpisode) {
      setIsLoading(true); 
      setCurrentEpisode(episodeNum);
      setSToLinks([]);
      setSelectedSToLink(null);
      setSToError(null);
      setEmbedUrl('');
    }
  };

  const handleSToLinkChange = (selectedUrl: string) => {
    const newLink = sToLinks.find(link => link.url === selectedUrl);
    if (newLink && newLink.url !== selectedSToLink?.url) {
      setSelectedSToLink(newLink);
      setIsLoading(true); 
      setEmbedUrl(newLink.url);
    }
  };


  return (
    <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-lg border">
      <div className="w-full md:w-64 lg:w-72 flex-shrink-0 flex flex-col space-y-3">

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Server</label>
          <Select
            value={selectedServer.id}
            onValueChange={handleServerChange}
          >
            <SelectTrigger className="w-full h-9">
              <SelectValue placeholder="Select server" />
            </SelectTrigger>
            <SelectContent>
              {SERVER_OPTIONS.map(server => (
                <SelectItem key={server.id} value={server.id}>
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        {isTvShow && initialData?.totalSeasons && (
          <>
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

        {selectedServer.id === 'vidsrc' && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">VidSrc Domain</label>
            <div className="flex items-center justify-between bg-muted p-1.5 rounded-md h-9">
              <Button
                variant="ghost"
                disabled={!selectedServer.domains?.length}
                size="icon"
                onClick={() => handleDomainCycle('prev')}
                className="h-6 w-6 text-muted-foreground hover:bg-accent disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground px-1 truncate flex-grow text-center" title={currentVidSrcDomain}>
                {currentVidSrcDomain || 'N/A'}
              </span>
              <Button
                variant="ghost"
                disabled={!selectedServer.domains?.length}
                size="icon"
                onClick={() => handleDomainCycle('next')}
                className="h-6 w-6 text-muted-foreground hover:bg-accent disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {selectedServer.id === 's.to' && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">S.to Hoster</label>
            {isSToLoading ? (
              <div className="h-9 flex items-center justify-center text-muted-foreground text-sm">Loading hosters...</div>
            ) : sToError ? (
               <div className="h-9 flex items-center justify-center text-destructive text-sm px-2 text-center leading-tight">{sToError}</div>
            ) : sToLinks.length > 0 && selectedSToLink ? (
              <Select
                value={selectedSToLink.url}
                onValueChange={handleSToLinkChange}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Select hoster" />
                </SelectTrigger>
                <SelectContent>
                  {sToLinks.map(link => (
                    <SelectItem key={link.url} value={link.url}>
                      {link.hoster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
               <div className="h-9 flex items-center justify-center text-muted-foreground text-sm">No hosters found.</div>
            )}
          </div>
        )}

      </div>

      <div className="flex-grow relative aspect-video md:aspect-auto md:min-h-[80vh] bg-black rounded-md overflow-hidden border">
        <AnimatePresence>
          {(isLoading || isSToLoading) && !embedUrl && (
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
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            {selectedServer.id === 's.to' && sToError ? (
              <span className="text-destructive">{sToError}</span>
            ) : selectedServer.id === 's.to' && !isSToLoading ? (
              <span className="text-muted-foreground">No stream links found for S.to.</span>
            ) : (isLoading || isSToLoading) ? (
              <span className="text-muted-foreground">Loading...</span>
            ) : (
              <span className="text-muted-foreground">Select options to start watching.</span>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default HostEmbed;
