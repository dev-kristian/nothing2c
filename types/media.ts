// types/media.ts

export interface Media {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    profile_path?: string | null;
    vote_average: number;
    media_type?: 'movie' | 'tv';
    release_date?: string;
    first_air_date?: string;
    watchlist_count?: number;
  }

  export interface SearchResult extends Media {
    overview: string;
  }

  export interface CrewMember {
    id: number;
    name: string;
    profile_path: string | null;
    character?: string;
    job?: string;
    roles: string[]
  }
  
  export interface Genre {
    id: number;
    name: string;
  }
  
  export interface DetailsData extends Media {
    episode_run_time?: number[];
    number_of_seasons?: number;
    number_of_episodes?: number;
    backdrop_path: string;
    tagline: string;
    overview: string;
    genres: Genre[];
    status: string;
    contentRating: string | null;
    credits: {
      cast: CrewMember[];
      crew: CrewMember[];
    };
    runtime: number;
    budget: number;
    revenue: number;
    homepage: string;
    spoken_languages: Array<{ english_name: string }>;
    vote_count: number;
    production_countries: Array<{ name: string }>;
    seasons?: Season[];
    external_ids?: {
      imdb_id?: string;
    };
  }
  
  export interface Season {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
  }
  
  export interface SeasonDetails {
    _id: string;
    air_date: string;
    name: string;
    overview: string;
    id: number;
    poster_path: string;
    season_number: number;
    episodes: Episode[];
  }
  
  export interface Episode {
    air_date: string;
    episode_number: number;
    episode_type: string;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    runtime: number;
    season_number: number;
    show_id: number;
    still_path: string;
    vote_average: number;
    vote_count: number;
    crew: CrewMember[];
  }

  export interface SelectedEpisode {
    seasonNumber: number;
    episodeNumber: number;
    seasonId: number;
    episodeId: number;
  }

  export interface VideoData {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
  }
  
  export interface TopWatchlistItem extends Media{
    weighted_score: number;
  }
  
  export interface ServerLink {
    server: number;
    link: string;
  }
  
  export interface BestMatch {
    similarity: number;
    href: string;
  }