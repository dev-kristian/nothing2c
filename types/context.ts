// types/context.ts
import { Timestamp } from 'firebase/firestore';
import { Media, UserData, Friend, FriendRequest, NotificationStatus, TopWatchlistItem, DateTimeSelection, Session, SearchResult } from './';

export interface UserDataContextType {
    userData: UserData | null;
    isLoading: boolean;
    watchlistItems: {
      movie: Media[];
      tv: Media[];
    };
    addToWatchlist: (item: Media, mediaType: 'movie' | 'tv') => Promise<void>;
    removeFromWatchlist: (id: number, mediaType: 'movie' | 'tv') => Promise<void>;
    updateNotificationStatus: (status: NotificationStatus) => Promise<void>;
    friends: Friend[];
    friendRequests: FriendRequest[];
    isLoadingFriends: boolean;
    isLoadingRequests: boolean;
    sendFriendRequest: (targetUser: { uid: string; username: string }) => Promise<void>;
    acceptFriendRequest: (request: FriendRequest) => Promise<void>;
    rejectFriendRequest: (request: FriendRequest) => Promise<void>;
    removeFriend: (friend: Friend) => Promise<void>;
  }

export interface MediaState {
  data: Media[];
  page: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

export interface TrendingContextType {
  trendingState: MediaState;
  mediaType: 'movie' | 'tv';
  timeWindow: 'day' | 'week';
  isInitialLoading: boolean;
  setMediaType: (type: 'movie' | 'tv') => void;
  setTimeWindow: (window: 'day' | 'week') => void;
  fetchTrending: () => Promise<void>;
}

export interface TopWatchlistContextType {
  topWatchlistItems: {
    movie: TopWatchlistItem[];
    tv: TopWatchlistItem[];
  };
  setTopWatchlistItems: React.Dispatch<React.SetStateAction<{
    movie: TopWatchlistItem[];
    tv: TopWatchlistItem[];
  }>>;
  isLoading: boolean;
  error: string | null;
  fetchTopWatchlistItems: (mediaType: 'movie' | 'tv') => Promise<void>;
}

export interface FirestoreWatchlistItem {
  id: number;
  media_type: 'movie' | 'tv';
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
  title?: string;
  name?: string;
  vote_average?: number;
  overview?: string;
  backdrop_path?: string;
  genre_ids?: number[];
  popularity?: number;
  vote_count?: number;
  original_language?: string;
  adult?: boolean;
  video?: boolean;
}

// Add for SessionContext
export interface SessionContextType {
  createSession: (dates: DateTimeSelection[]) => Promise<Session>;
  createPoll: (sessionId: string, movieTitles: string[]) => Promise<void>;
  updateUserDates: (sessionId: string, dates: DateTimeSelection[]) => Promise<void>;
  toggleVote: (sessionId: string, movieTitle: string) => Promise<void>;
  addMovieToPoll: (sessionId: string, movieTitle: string) => Promise<void>;
  removeMovieFromPoll: (sessionId: string, movieTitle: string) => Promise<void>;
  sessions: Session[];
}

export interface UserDate {
  date: Timestamp;
  hours: 'all' | Timestamp[];
}

// Add for SearchContext
export interface SearchState {
    results: SearchResult[];
    isLoading: boolean;
    error: string | null;
  }
  
  export interface SearchContextType {
    searchState: SearchState;
    setSearchResults: (results: SearchResult[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    clearSearch: () => void;
  }