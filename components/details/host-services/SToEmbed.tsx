'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { HostServiceProps, SToLink } from './types';

const SToEmbed: React.FC<HostServiceProps> = ({
  title,
  mediaType,
  currentSeason,
  currentEpisode,
  onUrlChange,
  onErrorChange,
}) => {
  const [sToLinks, setSToLinks] = useState<SToLink[]>([]);
  const [selectedSToLink, setSelectedSToLink] = useState<SToLink | null>(null);
  const [isSToLoading, setIsSToLoading] = useState(false);
  const [sToError, setSToError] = useState<string | null>(null);
  const isTvShow = mediaType === 'tv';

  const constructSToUrl = useCallback(() => {
    if (!title) return null;
    
    // --- THIS IS THE FIX ---
    const slug = title
      .toLowerCase()
      .normalize("NFD") // Decompose characters: 'ü' -> 'u' + '¨'
      .replace(/[\u0300-\u036f]/g, "") // Remove the accent marks (diacritics)
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\w-]+/g, ''); // Remove any remaining non-word characters

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
      const errorMsg = "Could not construct S.to URL (missing title or season/episode info?).";
      setSToError(errorMsg);
      onErrorChange?.(errorMsg);
      onUrlChange(null);
      return;
    }

    setIsSToLoading(true);
    setSToError(null);
    onErrorChange?.(null);
    setSToLinks([]);
    setSelectedSToLink(null);
    onUrlChange(null);

    try {
      const response = await fetch(`/api/german-host?url=${encodeURIComponent(sToUrl)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }
      const data = await response.json();
      if (data.links && data.links.length > 0) {
        setSToLinks(data.links);
        const firstLink = data.links[0];
        setSelectedSToLink(firstLink);
        onUrlChange(firstLink.url);
        toast({ title: "S.to Links Found", description: `Found ${data.links.length} stream options.` });
      } else {
        const errorMsg = 'No stream links found on S.to for this selection.';
        setSToError(errorMsg);
        onErrorChange?.(errorMsg);
        setSToLinks([]);
        toast({ title: "S.to Links", description: errorMsg, variant: "destructive" });
      }
    } catch (error: unknown) {
      console.error("Error fetching S.to links:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while fetching S.to links.';
      setSToError(errorMessage);
      onErrorChange?.(errorMessage);
      setSToLinks([]);
      toast({ title: "Error Fetching S.to", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSToLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constructSToUrl, onUrlChange, onErrorChange]); 

  // Fetch links when component mounts or relevant props change
  useEffect(() => {
    fetchSToLinks();
  }, [fetchSToLinks]); 

  const handleSToLinkChange = (selectedUrl: string) => {
    const newLink = sToLinks.find(link => link.url === selectedUrl);
    if (newLink && newLink.url !== selectedSToLink?.url) {
      setSelectedSToLink(newLink);
      onUrlChange(newLink.url);
    }
  };

  return (
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
  );
};

export default SToEmbed;