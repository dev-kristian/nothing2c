import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { DateTimeSelection, Friend, Session } from '@/types';

export const useCreateSession = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData();

  return useCallback(async (
    dates: DateTimeSelection[], 
    selectedFriends: Friend[]
  ): Promise<Session> => {
    if (!user || !userData) throw new Error('User must be logged in to create a session');
    try {
      const sessionsRef = collection(db, 'sessions');
      const newSessionRef = doc(sessionsRef);
      
      const tempDate = new Date();
  
      const participants: Record<string, { username: string; status: 'invited' | 'accepted' | 'declined' }> = {
        [user.uid]: { 
          username: userData.username, 
          status: 'accepted'
        }
      };
  
      selectedFriends.forEach(friend => {
        participants[friend.uid] = {
          username: friend.username,
          status: 'invited'
        };
      });
  
      const participantIds = [user.uid, ...selectedFriends.map(friend => friend.uid)];
  
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
        participants,
        participantIds,
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
        participants: Object.fromEntries(
          Object.entries(participants).map(([uid, data]) => [uid, data])
        ),
        participantIds,
        status: 'active'
      };
    } catch (error) {
      console.error("Error creating session: ", error);
      throw error;
    }
  }, [user, userData]);
};
