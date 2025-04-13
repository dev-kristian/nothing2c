

import { UserDate } from "./context";

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
  poll?: {
    id: string;
    movieTitles: string[];
    votes: {
      // Key is userId
      [userId: string]: string[];
    };
  };
  status: 'active' | 'completed';
}
  
  export interface Poll {
    id: string;
    movieTitles: string[];
    votes: { [username: string]: string[] };
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
