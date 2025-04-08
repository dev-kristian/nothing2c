import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { SessionContextType } from '@/types';
import {
  useCreateSession,
  useUpdateUserDates,
  usePollActions,
  useParticipantActions,
  useSessionSubscription
} from '@/hooks/session';

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const createSession = useCreateSession();
  const updateUserDates = useUpdateUserDates();
  const { createPoll, addMovieToPoll, removeMovieFromPoll, toggleVote } = usePollActions();
  const updateParticipantStatus = useParticipantActions();
  const sessions = useSessionSubscription();
  
  useEffect(() => {
    if (sessions !== undefined) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sessions]);

  const contextValue = useMemo(() => ({
    createSession,
    createPoll,
    updateUserDates,
    toggleVote,
    addMovieToPoll,
    removeMovieFromPoll,
    updateParticipantStatus,
    sessions: sessions || [], 
    isLoading
  }), [
    createSession,
    createPoll,
    updateUserDates,
    toggleVote,
    addMovieToPoll,
    removeMovieFromPoll,
    updateParticipantStatus,
    sessions,
    isLoading
  ]);
 
  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};