

import { User, Auth } from 'firebase/auth';
import { Media } from './media'; 

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<User | undefined>;
  signOut: () => Promise<boolean>; 
  isAuthenticated: boolean;
  initialAuthChecked: boolean;
  isSessionVerified: boolean; 
  markSessionVerified: (verified: boolean) => void; 
  auth: Auth;
}

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
  agreeToTerms?: boolean;
}

export interface UserData {
  username: string;
  email?: string;
  photoURL?: string | null; 
  createdAt?: Date;
  updatedAt?: Date;
  
  uid?: string;
  watchlist: {
    movie: Media[];
    tv: Media[];    
  };
  notification?: NotificationStatus;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  photoURL?: string | null; 
  
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  photoURL?: string;
  uid: string;
  username: string;
  exists?: boolean; 
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromUsername: string;
  fromPhotoURL?: string; 
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string;
  exists?: boolean;
}

export interface UserFriends {
  totalFriends: number;
  friendsList: { [uid: string]: boolean };
  sentRequests: { [uid: string]: boolean };
  receivedRequests: { [uid: string]: boolean };
}

export interface FriendSearchResult {
  uid: string;
  username: string;
}


type FriendshipStatus = 'friends' | 'pending_sent' | 'pending_received' | 'none';

export interface FriendSearchResultWithStatus extends FriendSearchResult {
  photoURL?: string; 
  friendshipStatus: FriendshipStatus; 
}

export type NotificationStatus = 'allowed' | 'denied' | 'unsupported';

export interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
}

export interface NotificationSubscriptionUIProps {
  isSupported: boolean | null;
  isIOS166OrHigher: boolean;
  isStandalone: boolean;
  userData: UserData | null;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  handleUpdateNotificationStatus: (status: NotificationStatus) => Promise<void>;
  handleSubscribe: () => Promise<void>;
  handleDismiss: () => void; 
}
