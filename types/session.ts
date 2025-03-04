// types/session.ts

import { UserDate } from "./context";

export interface Session {
  id: string;
  createdAt: Date;
  createdBy: string;
  createdByUid: string;
  userDates: {
    [username: string]: UserDate[];
  };
  participants: {
    [uid: string]: {
      username: string;
      status: 'invited' | 'accepted' | 'declined';
    };
  };
  participantIds: string[]; // Add this field
  poll?: {
    id: string;
    movieTitles: string[];
    votes: {
      [username: string]: string[];
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
    date: string;
    count: number;
    users: string[];
    hours: { [hour: number]: { count: number; users: string[] } };
  }
  
  export interface DateTimeSelection {
    date: Date;
    hours: number[] | 'all';
  }