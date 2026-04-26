import { ReactNode } from "react";


export interface Media {
  overview?: ReactNode;
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  profile_path?: string | null; 
  vote_average: number; 
  media_type?: 'movie' | 'tv' | 'person' | 'upcoming'; 
  release_date?: string; 
  first_air_date?: string; 
  watchlist_count?: number;
  addedAt?: string;
  genre_ids?: number[];
  popularity?: number;
}

export interface SearchResult extends Media {
  overview: string;
}

export interface CrewMember {
  department: string;
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
  production_countries: ProductionCountry[];
  seasons?: Season[];
  external_ids?: {
    imdb_id?: string;
  };
  production_companies: ProductionCompany[];
  videos?: VideoResults;
  reviews?: ReviewResults;
  recommendations?: MediaResults;
  similar?: MediaResults;
  release_dates?: ReleaseDatesResponse;
  content_ratings?: ContentRatingsResponse;
  'watch/providers'?: WatchProvidersResponse;
  origin_country?: string[];
}

export interface PersonDetails extends Media {
  adult?: boolean;
  also_known_as: string[];
  biography: string;
  birthday?: string | null;
  deathday?: string | null;
  gender?: number;
  homepage?: string | null;
  imdb_id?: string | null;
  known_for_department?: string;
  place_of_birth?: string | null;
  profile_path?: string | null;
  images?: {
    profiles: ImageAsset[];
  };
  external_ids?: PersonExternalIds;
  combined_credits?: PersonCombinedCredits;
}

export interface PersonExternalIds {
  facebook_id?: string | null;
  instagram_id?: string | null;
  tiktok_id?: string | null;
  twitter_id?: string | null;
  wikidata_id?: string | null;
  youtube_id?: string | null;
  imdb_id?: string | null;
}

export interface ImageAsset {
  aspect_ratio?: number;
  file_path: string;
  height?: number;
  width?: number;
  vote_average?: number;
  vote_count?: number;
}

export interface MediaCredit extends Media {
  adult?: boolean;
  backdrop_path?: string | null;
  character?: string;
  job?: string;
  episode_count?: number;
}

export interface PersonCombinedCredits {
  cast: MediaCredit[];
  crew: MediaCredit[];
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

export interface VideoResults {
  results: VideoData[];
}

export interface MediaResults {
  results: Media[];
}

export interface ReviewResults {
  results: Review[];
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priority?: number;
}

export interface WatchProviderRegion {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  ads?: WatchProvider[];
  free?: WatchProvider[];
}

export interface WatchProvidersResponse {
  results: Record<string, WatchProviderRegion>;
}

export interface ReleaseDateEntry {
  certification: string;
  descriptors?: string[];
  iso_639_1?: string;
  note?: string;
  release_date: string;
  type: number;
}

export interface ReleaseDateRegion {
  iso_3166_1: string;
  release_dates: ReleaseDateEntry[];
}

export interface ReleaseDatesResponse {
  results: ReleaseDateRegion[];
}

export interface ContentRatingEntry {
  iso_3166_1: string;
  rating: string;
  descriptors?: string[];
}

export interface ContentRatingsResponse {
  results: ContentRatingEntry[];
}

export interface FriendsWatchlistItem extends Media{
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

  export interface ReviewAuthorDetails {
      name: string;
      username: string;
      avatar_path: string | null;
      rating: number | null;
  }

  export interface Review {
      author: string;
      author_details: ReviewAuthorDetails;
      content: string;
      created_at: string;
      id: string;
      updated_at: string;
      url: string;
  }

  export interface ProductionCompany {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
  }

  export interface ProductionCountry {
    iso_3166_1: string;
    name: string;
  }
