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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false); 
  const isSubscribed = useRef(false);

  useEffect(() => {
    if (!user || !userData) return;
    if (isSubscribed.current) return;
  
    const sessionsRef = collection(db, 'sessions');
    
    const sessionsQuery = query(
      sessionsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );
    
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
  
        const participants = data.participants || {
          [data.createdByUid]: {
            username: data.createdBy,
            status: 'accepted'
          }
        };
        
        const participantIds = data.participantIds || Object.keys(participants);
        
        return {
          id: doc.id,
          createdAt,
          createdBy: data.createdBy || 'unknown',
          createdByUid: data.createdByUid || '',
          userDates: Object.fromEntries(userDates),
          participants,
          participantIds,
          poll: data.poll ? {
            id: data.poll.id,
            movieTitles: data.poll.movieTitles || [],
            votes: data.poll.votes || {}
          } : undefined,
          status: data.status || 'active'
        };
      });
      
      sessionsList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setSessions(sessionsList);
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }
    }, (error) => {
      console.error("Error fetching sessions:", error);
      setInitialLoadComplete(true);
      isSubscribed.current = false;
    });
  
    isSubscribed.current = true;
    
    return () => {
      unsubscribe();
      isSubscribed.current = false;
    };
  }, [user, userData, initialLoadComplete]);

  return { sessions, initialLoadComplete };
};
