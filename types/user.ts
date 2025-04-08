// types/user.ts
import { User, Auth } from 'firebase/auth';

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<User | undefined>; 
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  initialAuthChecked: boolean;
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
  createdAt?: Date;
  updatedAt?: Date;
  setupCompleted?: boolean;
  uid?: string;
  watchlist: {
    movie: { [movieId: string]: boolean };
    tv: { [tvId: string]: boolean };
  };
  notification?: NotificationStatus;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  setupCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  photoURL: string;
  uid: string;
  username: string;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: string; 
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

export interface FriendSearchResultWithStatus extends FriendSearchResult {
  requestStatus?: {
    exists: boolean;
    type?: 'sent' | 'received';
    status?: 'pending' | 'accepted' | 'rejected';
  };
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
