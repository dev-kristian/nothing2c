
'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import SpinningLoader from '@/components/SpinningLoader';
import { useSession } from '@/context/SessionContext';
import { useAuthUser } from '@/context/AuthUserContext';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react'; 
import isEqual from 'lodash/isEqual';
import { toast } from "@/hooks/use-toast";

import MovieNightCalendar from '@/components/home/MovieNightCalendar';
import MediaSuggestions from '@/components/sessions/MediaSuggestions';
import { DateTimeSelection, UserDate } from "@/types"; 
import { useParams, useRouter } from "next/navigation";
import { utcEpochToLocalSelections } from "@/lib/dateTimeUtils"; 
import SessionHeader from "@/components/sessions/SessionHeader";
import TopAvailability from "@/components/sessions/TopAvailability";
import SessionParticipants from "@/components/sessions/SessionParticipants";
import InvitationActionsBanner from '@/components/sessions/InvitationActionsBanner';
import { CompleteSessionDialog } from '@/components/sessions/CompleteSessionDialog'; 



const SessionPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { sessions, updateUserDates, isLoading: isLoadingSessions } = useSession();
  const { userData, isLoading: isLoadingUserData } = useAuthUser();

  const session = useMemo(() => sessions.find((s) => s.id === id), [sessions, id]);
  const datePopularity = useMemo(() => session?.aggregatedAvailability || [], [session]);

  const currentUserStatus = useMemo(() => {
    if (!userData?.uid || !session?.participants) return undefined;
    return session.participants[userData.uid]?.status;
  }, [session, userData]);

  const isReadOnly = currentUserStatus === 'invited' || session?.status === 'completed';

  const [currentSelectedDates, setCurrentSelectedDates] = useState<DateTimeSelection[]>([]);
  const [initialSelectedDates, setInitialSelectedDates] = useState<DateTimeSelection[]>([]);
  const [isDeclining, setIsDeclining] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState<boolean>(false); 

  

  const hasChanges = useMemo(() => !isEqual(currentSelectedDates, initialSelectedDates), [currentSelectedDates, initialSelectedDates]);

  const handleCalendarUpdate = useCallback((newDates: DateTimeSelection[]) => {
    setCurrentSelectedDates(newDates);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    
    const currentSession = sessions.find((s) => s.id === id);
    if (isReadOnly || !currentSession?.id || !hasChanges || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await updateUserDates(currentSession.id, currentSelectedDates);
      setInitialSelectedDates(currentSelectedDates);
      toast({
        title: "Availability Saved",
        description: "Your availability has been updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving dates via handleSaveChanges:', error);
       toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
     }
   }, [isReadOnly, sessions, id, hasChanges, isSaving, updateUserDates, currentSelectedDates]);

   const handleCancelChanges = useCallback(() => {
     setCurrentSelectedDates(initialSelectedDates);
   }, [initialSelectedDates]);

   const handleDeclineInitiated = () => {
    setIsDeclining(true);
  };

  
  const handleInitiateCompleteSession = useCallback(() => {
    
    setIsCompleteDialogOpen(true);
  }, []);

  

  useEffect(() => {
    
     if (session && userData?.uid) {
      const savedUserDates: UserDate[] = session.userDates?.[userData.uid] || [];
      const initialCalendarDates = utcEpochToLocalSelections(savedUserDates);
      setCurrentSelectedDates(initialCalendarDates);
      setInitialSelectedDates(initialCalendarDates);
    } else {
      setCurrentSelectedDates([]);
      setInitialSelectedDates([]);
    }
  }, [session, userData?.uid]);

  useEffect(() => {
    
     if (!isLoadingSessions && !session && !isDeclining) {
      const timer = setTimeout(() => {
        router.replace('/watch-together');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingSessions, session, id, router, isDeclining]);

  if (isLoadingSessions || isLoadingUserData || !userData) {
    
     return (
      <div className="flex justify-center items-center min-h-screen">
        <SpinningLoader />
      </div>
    );
  }

  if (!session) {
     
     if (isDeclining) {
      return null;
    }
    return <div className="text-center p-8 text-gray-400">Session {id} not found or access denied. Redirecting...</div>;
  }

  return (
    <> {/* Use Fragment */}
      <div className="p-2 md:p-4 max-w-7xl mx-auto">
        <SessionHeader
          session={session}
          datePopularity={datePopularity}
          currentUserId={userData?.uid}
          onInitiateCompleteSession={handleInitiateCompleteSession} 
        />

        {currentUserStatus === 'invited' && (
          <InvitationActionsBanner
          session={session}
          onDeclineInitiated={handleDeclineInitiated}
        />
      )}
      <SessionParticipants session={session} isReadOnly={isReadOnly} />

      {/* ... rest of the page content ... */}
       <div className="mb-8">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-label dark:text-label-dark">Select Your Availability</h2>
        </div>
        <p className="text-label-secondary dark:text-label-secondary-dark mb-4 text-sm">
          Click on dates to select when you&apos;re available. You can select multiple dates and specific hours.
        </p>

          <MovieNightCalendar
            selectedDates={currentSelectedDates}
            onDatesSelected={handleCalendarUpdate}
            datePopularity={datePopularity}
            activeUserId={userData.uid}
            userDates={session.userDates as Record<string, UserDate[]>}
            participants={session.participants}
            isReadOnly={isReadOnly}
           />
           {!isReadOnly && hasChanges && (
              <div className="mt-4 flex justify-end space-x-2">
                <Button onClick={handleCancelChanges} variant="outline" size="lg" disabled={isSaving}><X className="mr-2 h-4 w-4" />Cancel</Button>
                <Button onClick={handleSaveChanges} disabled={isSaving} size="lg">
                 {isSaving ? (<><SpinningLoader size={16} /><span className="ml-2">Saving...</span></>) : (<><Save className="mr-2 h-4 w-4" />Save Availability</>)}
               </Button>
             </div>
           )}
      </div>
      <div className="mb-8">
        <div className="flex items-center "><h2 className="text-xl font-semibold text-label dark:text-label-dark">Top Availability</h2></div>
        <p className="text-label-secondary dark:text-label-secondary-dark mb-4 text-sm">These dates have the highest availability among participants.</p>
        <TopAvailability datePopularity={datePopularity} participants={session.participants} />
      </div>
      <div className="mb-8">
        <div className="flex items-center"><h2 className="text-xl font-semibold text-label dark:text-label-dark">Media Suggestions</h2></div>
        <p className="text-label-secondary dark:text-label-secondary-dark mb-4 text-sm">Suggest and vote on movies or TV shows for the group to watch together.</p>
        <MediaSuggestions session={session} poll={session.poll} isReadOnly={isReadOnly} userId={userData.uid} />
      </div>
      </div>

      {/* Render the new Dialog Component */}
      <CompleteSessionDialog
        isOpen={isCompleteDialogOpen}
        onOpenChange={setIsCompleteDialogOpen}
        session={session}
        datePopularity={datePopularity}
      />

    </>
  );
};

export default SessionPage;
