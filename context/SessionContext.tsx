// context/SessionContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import { useUserData } from './UserDataContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc,
  query, 
  where,
  orderBy,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDoc, 
  deleteField,
  onSnapshot 
} from 'firebase/firestore';
import { DateTimeSelection, Session, SessionContextType, UserDate } from '@/types';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const { userData, friends, isLoadingFriends } = useUserData();
  const [sessions, setSessions] = useState<Session[]>([]);

  const createSession = useCallback(async (dates: DateTimeSelection[]): Promise<Session> => {
    if (!user || !userData) throw new Error('User must be logged in to create a session');
    try {
      const sessionsRef = collection(db, 'sessions');
      const newSessionRef = doc(sessionsRef);
      
      const tempDate = new Date();
  
      await setDoc(newSessionRef, {
        createdAt: serverTimestamp(),
        createdBy: userData.username,
        createdByUid: user.uid,
        userDates: {
          [userData.username]: dates.map(({ date, hours }) => ({
            date: Timestamp.fromDate(date),
            hours: hours === 'all' ? 'all' : hours.map(h => {
              const dateCopy = new Date(date);
              dateCopy.setHours(h);
              return Timestamp.fromDate(dateCopy);
            })
          }))
        },
        status: 'active'
      });
  
      return {
        id: newSessionRef.id,
        createdAt: tempDate,
        createdBy: userData.username,
        createdByUid: user.uid,
        userDates: {
          [userData.username]: dates.map(({ date, hours }) => ({
            date: date.toISOString(),
            hours: hours === 'all' ? 'all' : hours.map(h => {
              const dateCopy = new Date(date);
              dateCopy.setHours(h);
              return dateCopy.toISOString();
            })
          }))
        },
        status: 'active'
      };
    } catch (error) {
      console.error("Error creating session: ", error);
      throw error;
    }
  }, [user, userData]);

  useEffect(() => {
    if (!user || !userData || !friends || isLoadingFriends) return;

    const sessionsRef = collection(db, 'sessions');
    const relevantUids = [user.uid, ...friends.map(friend => friend.uid)];

    // Firestore 'in' query supports up to 10 values, so split into chunks if necessary
    const chunkSize = 10;
    const uidChunks = [];
    for (let i = 0; i < relevantUids.length; i += chunkSize) {
      uidChunks.push(relevantUids.slice(i, i + chunkSize));
    }

    const unsubscribeList: (() => void)[] = [];

    uidChunks.forEach(chunk => {
      const q = query(
        sessionsRef,
        where('createdByUid', 'in', chunk),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const sessionsList: Session[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          const createdAt = data.createdAt?.toDate() || new Date();
        
          const userDates = Object.entries(data.userDates || {}).map(([username, dates]) => {
            const userDates = (dates as any[]).map(({ date, hours }) => {
              const dateISO = date instanceof Timestamp 
                ? date.toDate().toISOString() 
                : typeof date === 'string' 
                  ? date 
                  : new Date().toISOString();
              
              let processedHours: string[] | 'all' = 'all';
              if (hours !== 'all') {
                processedHours = Array.isArray(hours) 
                  ? hours.map(h => {
                      if (h instanceof Timestamp) {
                        return h.toDate().toISOString();
                      }
                      return typeof h === 'string' ? h : new Date().toISOString();
                    })
                  : [];
              }
            
              return {
                date: dateISO,
                hours: processedHours
              };
            });

            return [username, userDates];
          });

          return {
            id: doc.id,
            createdAt,
            createdBy: data.createdBy || 'unknown',
            createdByUid: data.createdByUid || '',
            userDates: Object.fromEntries(userDates),
            poll: data.poll ? {
              id: data.poll.id,
              movieTitles: data.poll.movieTitles || [],
              votes: data.poll.votes || {}
            } : undefined,
            status: data.status || 'active'
          };
        });

        // Merge sessions from all chunks, ensuring no duplicates
        setSessions(prev => {
          const allSessions = [...prev, ...sessionsList];
          const uniqueSessions = Array.from(
            new Map(allSessions.map(session => [session.id, session])).values()
          );
          return uniqueSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        });
      }, (error) => {
        console.error("Error fetching sessions: ", error);
      });

      unsubscribeList.push(unsubscribe);
    });

    // Cleanup all subscriptions
    return () => {
      unsubscribeList.forEach(unsubscribe => unsubscribe());
    };
  }, [user, userData, friends, isLoadingFriends]);

  const updateUserDates = useCallback(async (sessionId: string, dates: DateTimeSelection[]) => {
    if (!user || !userData) throw new Error('User must be logged in to update dates');
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        [`userDates.${userData.username}`]: dates.map(({ date, hours }) => ({
          date: Timestamp.fromDate(date),
          hours: hours === 'all' ? 'all' : hours.map(h => Timestamp.fromDate(new Date(date.setHours(h))))
        }))
      });
    } catch (error) {
      console.error("Error updating user dates: ", error);
      throw error;
    }
  }, [user, userData]);

  const createPoll = useCallback(async (sessionId: string, movieTitles: string[]) => {
    if (!user || !userData) throw new Error('User must be logged in to create a poll');
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const pollId = Math.random().toString(36).substr(2, 9);
      const pollData = {
        id: pollId,
        movieTitles,
        votes: {}
      };
  
      await updateDoc(sessionRef, {
        poll: pollData
      });
    } catch (error) {
      console.error("Error creating poll: ", error);
      throw error;
    }
  }, [user, userData]);

  const addMovieToPoll = useCallback(async (sessionId: string, movieTitle: string) => {
    if (!user || !userData) throw new Error('User must be logged in to add a movie');
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnapshot = await getDoc(sessionRef);
      const sessionData = sessionSnapshot.data() as Session;
  
      if (!sessionData.poll) throw new Error('No poll exists for this session');
  
      const updatedMovieTitles = [...sessionData.poll.movieTitles, movieTitle];
  
      await updateDoc(sessionRef, {
        'poll.movieTitles': updatedMovieTitles
      });
    } catch (error) {
      console.error("Error adding movie to poll: ", error);
      throw error;
    }
  }, [user, userData]);

  const removeMovieFromPoll = useCallback(async (sessionId: string, movieTitle: string) => {
    if (!user || !userData) throw new Error('User must be logged in to remove a movie');
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnapshot = await getDoc(sessionRef);
      const sessionData = sessionSnapshot.data() as Session;
  
      if (!sessionData.poll) throw new Error('No poll exists for this session');
  
      const updatedMovieTitles = sessionData.poll.movieTitles.filter(title => title !== movieTitle);
  
      await updateDoc(sessionRef, {
        'poll.movieTitles': updatedMovieTitles,
        [`poll.votes.${movieTitle}`]: deleteField()
      });
    } catch (error) {
      console.error("Error removing movie from poll: ", error);
      throw error;
    }
  }, [user, userData]);

  const toggleVote = useCallback(async (sessionId: string, movieTitle: string) => {
    if (!user || !userData) throw new Error('User must be logged in to vote');
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      const sessionSnapshot = await getDoc(sessionRef);
      const sessionData = sessionSnapshot.data() as Session;

      if (!sessionData.poll) throw new Error('No poll exists for this session');

      const userVotes = sessionData.poll.votes[userData.username] || [];
      const updatedVotes = userVotes.includes(movieTitle)
        ? userVotes.filter(vote => vote !== movieTitle)
        : [...userVotes, movieTitle];

      await updateDoc(sessionRef, {
        [`poll.votes.${userData.username}`]: updatedVotes
      });
    } catch (error) {
      console.error("Error toggling vote for movie: ", error);
      throw error;
    }
  }, [user, userData]);

  const contextValue = useMemo(() => ({
    createSession,
    createPoll,
    updateUserDates,
    toggleVote,
    addMovieToPoll,
    removeMovieFromPoll,
    sessions
  }), [
    createSession,
    createPoll,
    updateUserDates,
    toggleVote,
    addMovieToPoll,
    removeMovieFromPoll,
    sessions
  ]);
  
  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};
