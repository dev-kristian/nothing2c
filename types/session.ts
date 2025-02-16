// types/session.ts

export interface Session {
    id: string;
    createdAt: Date;
    createdBy: string;
    userDates: {
      [username: string]: {
        date: string;
        hours: string[] | 'all';
      }[];
    };
    poll?: Poll;
    status: 'active' | 'inactive';
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