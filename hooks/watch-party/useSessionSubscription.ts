import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where,
  orderBy,
  Timestamp,
  onSnapshot 
} from 'firebase/firestore';
import { Session } from '@/types';

export const useSessionSubscription = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData();
  const [sessions, setSessions] = useState<Session[]>([]);
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!user || !userData) return;
    if (isSubscribed.current) return; // Prevent duplicate subscriptions
  
    const sessionsRef = collection(db, 'sessions');
    const unsubscribeList: (() => void)[] = [];
  
    // Single query using participantIds
    const combinedQuery = query(
      sessionsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );
  
    isSubscribed.current = true; // Mark as subscribed before setting up listener
    const unsubscribe = onSnapshot(combinedQuery, (querySnapshot) => {
      processSessionsSnapshot(querySnapshot);
    }, (error) => {
      console.error("Error fetching sessions:", error);
      isSubscribed.current = false; // Reset on error
    });
  
    unsubscribeList.push(unsubscribe);
  
    // Query 2: Sessions where user is a participant (using a participantIds array)
    const participantQuery = query(
      sessionsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );
  
    const participantUnsubscribe = onSnapshot(participantQuery, (querySnapshot) => {
      processSessionsSnapshot(querySnapshot);
    }, (error) => {
      console.error("Error fetching participant sessions:", error);
    });
  
    unsubscribeList.push(participantUnsubscribe);
  
    // Helper function to process session snapshots
    function processSessionsSnapshot(querySnapshot: any) {
      const sessionsList: Session[] = querySnapshot.docs.map((doc: { data: () => any; id: any; }) => {
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
  
        // Ensure participants is always defined
        const participants = data.participants || {
          [data.createdByUid]: {
            username: data.createdBy,
            status: 'accepted'
          }
        };
        
        return {
          id: doc.id,
          createdAt,
          createdBy: data.createdBy || 'unknown',
          createdByUid: data.createdByUid || '',
          userDates: Object.fromEntries(userDates),
          participants,
          poll: data.poll ? {
            id: data.poll.id,
            movieTitles: data.poll.movieTitles || [],
            votes: data.poll.votes || {}
          } : undefined,
          status: data.status || 'active'
        };
      });
  
      // Merge sessions, ensuring no duplicates
      setSessions(prev => {
        const allSessions = [...prev, ...sessionsList];
        const uniqueSessions = Array.from(
          new Map(allSessions.map(session => [session.id, session])).values()
        );
        return uniqueSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      });
    }
  
    // Cleanup
    return () => {
      unsubscribeList.forEach(unsubscribe => unsubscribe());
      isSubscribed.current = false;
    };
  }, [user, userData]);

  return sessions;
};
