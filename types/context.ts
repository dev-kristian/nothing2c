
import { Media, UserData, Friend, FriendRequest, DateTimeSelection, Session, SearchResult, MediaPollItem } from './'; // Added MediaPollItem
import { KeyedMutator } from 'swr';

export type TopWatchlistItem = FirestoreWatchlistItem; // Assuming this is defined elsewhere or should be FirestoreWatchlistItem

export interface UserDataContextType {
    userData: UserData | null;
    isLoading: boolean;
    mutateUserData: KeyedMutator<UserData | null>;
    friends: Friend[];
    friendRequests: FriendRequest[];
    isLoadingFriends: boolean;
    isLoadingRequests: boolean;
    sendFriendRequest: (targetUser: { uid: string; username: string }) => Promise<void>;
    acceptFriendRequest: (request: FriendRequest) => Promise<void>;
    rejectFriendRequest: (request: FriendRequest) => Promise<void>;
    removeFriend: (friend: Friend) => Promise<void>;
    updateNotificationStatus: (status: 'allowed' | 'denied' | 'unsupported') => Promise<void>; 
  }

export interface MediaState {
  data: Media[];
  page: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
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

export interface SessionContextType {
  // Updated createSession signature to accept optional mediaItems
  createSession: (dates: DateTimeSelection[], selectedFriends: Friend[], mediaItems?: MediaPollItem[]) => Promise<string>;
  // Removed createPoll as it's now handled during session creation
  updateUserDates: (sessionId: string, dates: DateTimeSelection[]) => Promise<void>;
  toggleVote: (sessionId: string, mediaId: number) => Promise<void>; // Changed to mediaId
  addMovieToPoll: (sessionId: string, mediaItem: MediaPollItem) => Promise<void>; // Changed to mediaItem
  removeMovieFromPoll: (sessionId: string, mediaId: number) => Promise<void>; // Changed to mediaId
  updateParticipantStatus: (sessionId: string, status: 'accepted' | 'declined') => Promise<void>;
  sessions: Session[];
  isLoading: boolean;
}


export interface FirestoreUserDate {
  dateEpoch: number; 
  hoursEpoch: number[]; 
}


export interface UserDate {
  dateEpoch: number;
  hoursEpoch: number[];
}

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
