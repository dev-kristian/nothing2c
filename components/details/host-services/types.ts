export interface SToLink {
  hoster: string;
  url: string;
}

export interface HostServiceProps {
  tmdbId: number;
  title: string;
  mediaType: 'movie' | 'tv';
  currentSeason: number;
  currentEpisode: number;
  onUrlChange: (url: string | null) => void;
  onErrorChange?: (error: string | null) => void;
}
