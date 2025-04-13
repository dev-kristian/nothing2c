

import { UserDate } from "./context";

// Define the structure for items stored in the poll
export interface MediaPollItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  release_date: string | null; // Combined field for movie release_date and tv first_air_date
  vote_average: number | null;
}

export interface Session {
  finalDate?: number; 
  id: string;
  createdAtEpoch: number; 
  createdBy: string;
  createdByUid: string;
  userDates: {
    // Key is userId
    [userId: string]: UserDate[];
  };
  participants: {
    [uid: string]: {
      username: string;
      status: 'invited' | 'accepted' | 'declined';
    };
  };
  participantIds: string[];
  aggregatedAvailability?: DatePopularity[];
  poll?: Poll; // Use the updated Poll interface
  status: 'active' | 'completed';
  completedAtEpoch?: number; // Optional: Timestamp when completed
  finalChoice?: { // Optional: Stores the final decision
    dateEpoch: number | null;
    mediaItem: MediaPollItem | null; // Store the full winning item
  };
}

  // Updated Poll interface
  export interface Poll {
    // id might not be needed if it's always nested within a session
    mediaItems: MediaPollItem[]; // Array of detailed media items
    votes: {
      // Key is userId
      [userId: string]: number[]; // Array of media item IDs the user voted for
    };
  }

export interface DatePopularity {
  dateEpoch: number;
  count: number;
  users: string[]; // Stores userIds
  hours: Record<string, { 
    count: number; 
    users: string[]; 
    hourEpoch: number; 
  }>; 
}
  
  
  
  export interface DateTimeSelection {
    date: Date;
    hours: number[]; 
  }
