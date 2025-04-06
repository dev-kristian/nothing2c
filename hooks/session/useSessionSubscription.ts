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
import { FirestoreUserDate } from '@/types/context';

export const useSessionSubscription = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData();
  const [sessions, setSessions] = useState<Session[]>([]);
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!user || !userData) return;
    if (isSubscribed.current) return; // Prevent duplicate subscriptions
  
    const sessionsRef = collection(db, 'sessions');
    
    // Single query using participantIds
    const sessionsQuery = query(
      sessionsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    // Set up the listener
    const unsubscribe = onSnapshot(sessionsQuery, (querySnapshot) => {
      const sessionsList: Session[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        const createdAt = data.createdAt?.toDate() || new Date();
      
        const userDates = Object.entries(data.userDates || {}).map(([username, dates]) => {
          const userDates = (dates as FirestoreUserDate[]).map(({ date, hours }) => {
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
        
        // Include participantIds from the data or create a default array
        const participantIds = data.participantIds || Object.keys(participants);
        
        return {
          id: doc.id,
          createdAt,
          createdBy: data.createdBy || 'unknown',
          createdByUid: data.createdByUid || '',
          userDates: Object.fromEntries(userDates),
          participants,
          participantIds, // Added this line to include participantIds
          poll: data.poll ? {
            id: data.poll.id,
            movieTitles: data.poll.movieTitles || [],
            votes: data.poll.votes || {}
          } : undefined,
          status: data.status || 'active'
        };
      });
      
      // Sort sessions by creation date (newest first)
      sessionsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setSessions(sessionsList);
    }, (error) => {
      console.error("Error fetching sessions:", error);
      isSubscribed.current = false; // Reset on error
    });
  
    // Mark as subscribed after setting up the listener
    isSubscribed.current = true;
    
    // Cleanup
    return () => {
      unsubscribe();
      isSubscribed.current = false;
    };
  }, [user, userData]);

  return sessions;
};
