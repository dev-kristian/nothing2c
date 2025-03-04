import { useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, deleteField } from 'firebase/firestore';
import { Session } from '@/types';

export const usePollActions = () => {
  const { user } = useAuthContext();
  const { userData } = useUserData();

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

  return {
    createPoll,
    addMovieToPoll,
    removeMovieFromPoll,
    toggleVote
  };
};
