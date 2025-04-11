// types/user.ts
// types/user.ts
import { User, Auth } from 'firebase/auth';
import { Media } from './media'; // Add this import

export interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<User | undefined>;
  signOut: () => Promise<boolean>; // Changed return type to Promise<boolean>
  isAuthenticated: boolean;
  initialAuthChecked: boolean;
  isSessionVerified: boolean; // Restore session verification state
  markSessionVerified: (verified: boolean) => void; // Restore function to update session state
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
  photoURL?: string | null; // Add optional photoURL here too
  createdAt?: Date;
  updatedAt?: Date;
  // Removed setupCompleted
  uid?: string;
  watchlist: {
    movie: Media[];
    tv: Media[];    // Changed from object to array of Media
  };
  notification?: NotificationStatus;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  photoURL?: string | null; // Add optional photoURL
  // Removed setupCompleted
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
  fromPhotoURL?: string; // Add optional photoURL
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

// Define the possible friendship statuses (can also be defined here or imported)
type FriendshipStatus = 'friends' | 'pending_sent' | 'pending_received' | 'none';

export interface FriendSearchResultWithStatus extends FriendSearchResult {
  photoURL?: string; // Add optional photoURL
  friendshipStatus: FriendshipStatus; // Replace requestStatus with combined status
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
