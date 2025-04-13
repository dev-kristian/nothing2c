import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc
} from 'firebase/firestore';
// Import Poll and MediaPollItem as well
import { Session, UserDate, DatePopularity, MediaPollItem } from '@/types';
import isEqual from 'lodash/isEqual';

export const useSessionSubscription = () => {
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const isSubscribed = useRef(false);
  // Ref to store unsubscribe functions for subcollection listeners
  const subUnsubscribes = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    if (!user) {
      setSessions([]); // Clear sessions if user logs out
      setInitialLoadComplete(false);
      // Ensure all sub-listeners are cleaned up if user logs out
      subUnsubscribes.current.forEach(unsub => unsub());
      subUnsubscribes.current.clear();
      isSubscribed.current = false;
      return;
    }
    if (isSubscribed.current) return; // Prevent duplicate main subscription

    const sessionsRef = collection(db, 'sessions');
    
    const sessionsQuery = query(
      sessionsRef,
      where('participantIds', 'array-contains', user.uid),
      orderBy('createdAtEpoch', 'desc')
    );

    const unsubscribeMain = onSnapshot(sessionsQuery, (querySnapshot) => {
      const currentSessionIds = new Set<string>();

      const sessionsListPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const sessionId = docSnapshot.id;
        currentSessionIds.add(sessionId);
        const data = docSnapshot.data();

        const createdAtEpoch = typeof data.createdAtEpoch === 'number'
            ? data.createdAtEpoch
            : Date.now();

        // Process userDates (now keyed by userId)
        const processedUserDates = Object.entries(data.userDates || {}).map(([userId, epochDates]) => {
          const userDatesArray: UserDate[] = Array.isArray(epochDates) ? epochDates as UserDate[] : [];
          const validatedDates = userDatesArray.filter(d =>
             d && typeof d.dateEpoch === 'number' && !isNaN(d.dateEpoch) && 'hoursEpoch' in d &&
             (Array.isArray(d.hoursEpoch) && d.hoursEpoch.every(h => typeof h === 'number' && !isNaN(h))) // Removed 'all' check here too for consistency
          );
          if (validatedDates.length !== userDatesArray.length) {
              // Log with userId now
              console.warn(`[SessionSub ${sessionId}] Filtered invalid UserDate entries for user ${userId}. Original:`, epochDates, "Filtered:", validatedDates);
          }
          // Return userId as the key
          return [userId, validatedDates];
        });

        const participants = data.participants || {
          [data.createdByUid]: { // Default if participants field missing
            username: data.createdBy || 'unknown',
            status: 'accepted'
          }
        };

        const participantIds = data.participantIds || Object.keys(participants);

        // Construct the base session object WITHOUT aggregatedAvailability initially
        const sessionBase: Session = {
          id: sessionId,
          createdAtEpoch,
          createdBy: data.createdBy || 'unknown',
          createdByUid: data.createdByUid || '',
          userDates: Object.fromEntries(processedUserDates),
          participants,
          participantIds,
          // Updated poll processing to use mediaItems and expect votes as number[]
          poll: data.poll ? {
            mediaItems: Array.isArray(data.poll.mediaItems) ? data.poll.mediaItems as MediaPollItem[] : [], // Ensure it's an array
            votes: typeof data.poll.votes === 'object' ? data.poll.votes as { [userId: string]: number[] } : {} // Ensure votes are objects mapping to number arrays
          } : undefined,
          status: data.status || 'active',
          // aggregatedAvailability will be added by the sub-listener, finalChoice might also be present
          finalChoice: data.finalChoice || undefined,
          completedAtEpoch: data.completedAtEpoch || undefined,
        };

        // --- Set up or reuse sub-listener ---
        if (!subUnsubscribes.current.has(sessionId)) {
          const aggDocRef = doc(db, 'sessions', sessionId, 'computed', 'aggregatedAvailability');
          const unsubAgg = onSnapshot(aggDocRef, (aggSnapshot) => {
            let availabilityData: DatePopularity[] = [];
            if (aggSnapshot.exists()) {
              const aggData = aggSnapshot.data();
             if (Array.isArray(aggData?.data)) {
               availabilityData = aggData.data as DatePopularity[];
             } else {
                console.warn(`[SessionSub ${sessionId}] Aggregated data field missing or not array.`);
             }
            } else {
            }
            // Update the specific session in the main state ONLY if data changed
            setSessions(prevSessions => {
              const index = prevSessions.findIndex(s => s.id === sessionId);
              if (index === -1) return prevSessions; // Session might have been removed already

              const existingSession = prevSessions[index];
              // Only update if the aggregatedAvailability data has actually changed
              if (!isEqual(existingSession.aggregatedAvailability, availabilityData)) {
                const updatedSession = { ...existingSession, aggregatedAvailability: availabilityData };
                const newSessions = [...prevSessions];
                newSessions[index] = updatedSession;
                return newSessions; // Return new array only if changed
              } else {
                 return prevSessions; // Return previous state reference if no change
              }
            });
          }, (error) => {
            console.error(`[SessionSub ${sessionId}] Error listening to aggregated availability:`, error);
             setSessions(prevSessions => {
               const index = prevSessions.findIndex(s => s.id === sessionId);
               if (index === -1) return prevSessions;
               if (prevSessions[index].aggregatedAvailability === undefined) {
                 return prevSessions; // Already marked as undefined, no change needed
               }
               const updatedSession = { ...prevSessions[index], aggregatedAvailability: undefined };
               const newSessions = [...prevSessions];
               newSessions[index] = updatedSession;
               return newSessions;
             });
          });
          subUnsubscribes.current.set(sessionId, unsubAgg);
        }

        return sessionBase; // Return the base session object immediately
      });

      Promise.all(sessionsListPromises).then(sessionsList => {
        sessionsList.sort((a, b) => b.createdAtEpoch - a.createdAtEpoch);

        setSessions(prevSessions => {
           const updatedSessions = sessionsList.map(newSession => {
             const existingSession = prevSessions.find(ps => ps.id === newSession.id);
             return {
               ...newSession,
               aggregatedAvailability: existingSession?.aggregatedAvailability // Preserve existing agg data
             };
           });

           if (!isEqual(prevSessions, updatedSessions)) {
             return updatedSessions;
           } else {
             return prevSessions; // Return the old reference if no change
           }
        });


        // Clean up listeners for sessions that no longer exist in the query result
        subUnsubscribes.current.forEach((unsub, sid) => {
          if (!currentSessionIds.has(sid)) {
            unsub();
            subUnsubscribes.current.delete(sid);
          }
        });

        if (!initialLoadComplete) {
          setInitialLoadComplete(true);
        }
      }); // Close .then() from Promise.all
    }, (error) => { // Error handler for main onSnapshot
      console.error("Error fetching sessions:", error);
      setInitialLoadComplete(true);
      // Clean up all listeners on main query error
      isSubscribed.current = false;
    });
  
    isSubscribed.current = true;

    // Capture the ref's current value for the cleanup function
    const currentUnsubscribes = subUnsubscribes.current;

    // Cleanup function for the main effect
    return () => {
      unsubscribeMain();
      // Use the captured value in the cleanup
      currentUnsubscribes.forEach(unsub => unsub()); // Unsubscribe all sub-listeners
      currentUnsubscribes.clear(); // Clear the map using the captured value
      isSubscribed.current = false;
    };
  }, [user, initialLoadComplete]);

  return { sessions, initialLoadComplete };
};
