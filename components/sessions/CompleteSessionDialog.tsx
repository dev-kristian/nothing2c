'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import SpinningLoader from '@/components/SpinningLoader';
import { CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { Poll, DatePopularity, Session, MediaPollItem } from "@/types";
import { formatEpochToLocalTime } from "@/lib/dateTimeUtils";



interface FinalizeSessionPayload {
  sendNotification: boolean;
  forceFinalize?: boolean;
  finalDateEpoch?: number | null;
  finalMovieTitle?: string | null;
}

interface TiedTimeOption {
  epoch: number;
  formatted: string;
}


const findWinningDate = (availabilityData: DatePopularity[]): { winner: TiedTimeOption | null; ties: TiedTimeOption[] } => {
  const result: { winner: TiedTimeOption | null; ties: TiedTimeOption[] } = { winner: null, ties: [] };
  if (!availabilityData || availabilityData.length === 0) return result;

  const topDate: DatePopularity = availabilityData[0];
  if (!topDate.hours || Object.keys(topDate.hours).length === 0) return result;

  let maxHourCount: number = -1;
  const potentialWinningHours: { key: string; epoch: number }[] = [];

  for (const hourData of Object.values(topDate.hours)) {
    if (hourData.count > maxHourCount) maxHourCount = hourData.count;
  }

  if (maxHourCount <= 0) return result; 

  for (const [hourKey, hourData] of Object.entries(topDate.hours)) {
    if (hourData.count === maxHourCount) {
      const hourEpoch = topDate.dateEpoch + parseInt(hourKey, 10) * 60 * 60 * 1000;
      potentialWinningHours.push({ key: hourKey, epoch: hourEpoch });
    }
  }

  potentialWinningHours.sort((a, b) => a.epoch - b.epoch);

  const formattedOptions: TiedTimeOption[] = potentialWinningHours.map(h => ({
    epoch: h.epoch,
    formatted: formatEpochToLocalTime(h.epoch)
  }));

  if (formattedOptions.length === 1) {
    result.winner = formattedOptions[0];
  } else if (formattedOptions.length > 1) {
    result.ties = formattedOptions;
  }
  return result;
};


const findWinningMovie = (poll: Poll | undefined): { winner: MediaPollItem | null; ties: MediaPollItem[] } => {
    const result: { winner: MediaPollItem | null; ties: MediaPollItem[] } = { winner: null, ties: [] };
    
    if (!poll || !poll.mediaItems || poll.mediaItems.length === 0) return result;

    
    if (!poll.votes || Object.keys(poll.votes).length === 0) {
        if (poll.mediaItems.length > 1) {
            result.ties = poll.mediaItems; 
        } else {
            result.winner = poll.mediaItems[0]; 
        }
        return result;
    }

    
    const voteCounts: { [mediaId: number]: number } = {};
    poll.mediaItems.forEach(item => { voteCounts[item.id] = 0; });

    
    Object.values(poll.votes || {}).forEach((userVoteArray: number[]) => {
        userVoteArray.forEach(votedId => {
            if (voteCounts.hasOwnProperty(votedId)) {
                voteCounts[votedId]++;
            }
        });
    });

    let maxVotes: number = -1;
    const potentialWinningIds: number[] = [];

    for (const count of Object.values(voteCounts)) {
        if (count > maxVotes) maxVotes = count;
    }

    if (maxVotes >= 0) { 
        for (const [idStr, count] of Object.entries(voteCounts)) {
            if (count === maxVotes) {
                potentialWinningIds.push(parseInt(idStr, 10));
            }
        }
    }

    
    const potentialWinningItems = poll.mediaItems.filter(item => potentialWinningIds.includes(item.id));

    
    potentialWinningItems.sort((a, b) => {
        const indexA = poll.mediaItems.findIndex(item => item.id === a.id);
        const indexB = poll.mediaItems.findIndex(item => item.id === b.id);
        return indexA - indexB;
    });


    if (potentialWinningItems.length === 1) {
        result.winner = potentialWinningItems[0];
    } else if (potentialWinningItems.length > 1) {
        result.ties = potentialWinningItems;
    } else if (potentialWinningItems.length === 0 && poll.mediaItems.length === 1) {
        
        result.winner = poll.mediaItems[0];
    } else if (potentialWinningItems.length === 0 && poll.mediaItems.length > 1) {
         
         result.ties = poll.mediaItems;
    }

    return result;
};


const getParticipantNames = (
    session: Session | undefined | null,
    
    filterFn: (uid: string, participant: { username: string; status: 'invited' | 'accepted' | 'declined' }) => boolean
): string[] => {
    if (!session?.participants) return [];
    
    return Object.entries(session.participants)
        .filter(([uid, data]) => filterFn(uid, data as { username: string; status: 'invited' | 'accepted' | 'declined' }))
        .map(([, data]) => (data as { username: string }).username) 
        .sort();
};

interface CompleteSessionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    session: Session | undefined | null;
    datePopularity: DatePopularity[];
}

export const CompleteSessionDialog: React.FC<CompleteSessionDialogProps> = ({
    isOpen,
    onOpenChange,
    session,
    datePopularity
}) => {
  const [isCompletingSession, setIsCompletingSession] = useState<boolean>(false);
  const [sendCompletionNotification, setSendCompletionNotification] = useState<boolean>(true);

  
  const [tiedDates, setTiedDates] = useState<TiedTimeOption[]>([]);
  
  const [tiedMovies, setTiedMovies] = useState<MediaPollItem[]>([]);
  const [selectedFinalDateEpoch, setSelectedFinalDateEpoch] = useState<number | null>(null);
  
  const [selectedFinalMovieId, setSelectedFinalMovieId] = useState<number | null>(null);
  const [determinedWinningDate, setDeterminedWinningDate] = useState<TiedTimeOption | null>(null);
  
  const [determinedWinningMovie, setDeterminedWinningMovie] = useState<MediaPollItem | null>(null);


  const [pendingInviteNames, setPendingInviteNames] = useState<string[]>([]);
  const [awaitingAvailabilityNames, setAwaitingAvailabilityNames] = useState<string[]>([]);
  const [awaitingVoteNames, setAwaitingVoteNames] = useState<string[]>([]);

  
  useEffect(() => {
      if (session) {
          const { winner: dateWinner, ties: dateTies } = findWinningDate(datePopularity);
          const { winner: movieWinner, ties: movieTies } = findWinningMovie(session.poll);

          setDeterminedWinningDate(dateWinner);
          setTiedDates(dateTies);
          setDeterminedWinningMovie(movieWinner); 
          setTiedMovies(movieTies); 

          
          setSelectedFinalDateEpoch(dateTies.length > 0 ? dateTies[0].epoch : (dateWinner ? dateWinner.epoch : null));
          setSelectedFinalMovieId(movieTies.length > 0 ? movieTies[0].id : (movieWinner ? movieWinner.id : null));

          
          setPendingInviteNames(getParticipantNames(session, (_uid, p) => p.status === 'invited')); 
          setAwaitingAvailabilityNames(getParticipantNames(session, (uid, p) => 
              p.status === 'accepted' && (!session.userDates?.[uid] || session.userDates[uid].length === 0)
          ));
          setAwaitingVoteNames(getParticipantNames(session, (uid, p) => { 
              if (p.status !== 'accepted' || !session.poll || !session.poll.mediaItems || session.poll.mediaItems.length === 0) return false;
              const userVotes = session.poll.votes?.[uid];
              return !userVotes || userVotes.length === 0;
          }));
      }
  }, [session, datePopularity]);

  
  const hasDateTies = useMemo(() => tiedDates.length > 1, [tiedDates]);
  const hasMovieTies = useMemo(() => tiedMovies.length > 1, [tiedMovies]);
  const hasAnyTies = useMemo(() => hasDateTies || hasMovieTies, [hasDateTies, hasMovieTies]);
  const hasWarnings = useMemo(() => pendingInviteNames.length > 0 || awaitingAvailabilityNames.length > 0 || awaitingVoteNames.length > 0, [pendingInviteNames, awaitingAvailabilityNames, awaitingVoteNames]);


  
  const finalMovieDisplay = useMemo(() => {
      if (hasMovieTies) {
          return tiedMovies.find(m => m.id === selectedFinalMovieId)?.title;
      }
      return determinedWinningMovie?.title;
  }, [hasMovieTies, tiedMovies, selectedFinalMovieId, determinedWinningMovie]);

  const finalDateDisplay = hasDateTies ? tiedDates.find(d => d.epoch === selectedFinalDateEpoch)?.formatted : (determinedWinningDate?.formatted || null);
  


  const handleDialogConfirmAction = useCallback(async () => {
    if (!session?.id || isCompletingSession) return;

    
    if (hasDateTies && selectedFinalDateEpoch === null) {
      toast({ title: "Selection Required", description: "Please select the final date and time.", variant: "destructive" });
      return;
    }
    
    if (hasMovieTies && selectedFinalMovieId === null) {
      toast({ title: "Selection Required", description: "Please select the final movie or show.", variant: "destructive" });
      return;
    }

    setIsCompletingSession(true);
    
    const payload: FinalizeSessionPayload = {
        sendNotification: sendCompletionNotification,
    };

    
    
    const finalMovieTitleToSend = hasMovieTies
        ? tiedMovies.find(m => m.id === selectedFinalMovieId)?.title ?? null
        : determinedWinningMovie?.title ?? null;

    if (hasAnyTies) {
        payload.forceFinalize = true;
        payload.finalDateEpoch = selectedFinalDateEpoch;
        
        payload.finalMovieTitle = finalMovieTitleToSend;
    }
    
    
    

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 202) {
             console.error("Received unexpected 202 from backend during finalization.");
             toast({ title: "Sync Error", description: "Session state might be out of sync. Please refresh and try again.", variant: "destructive" });
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to complete session: ${response.statusText}`);
        }
      } else {
          toast({
            title: hasAnyTies ? "Session Finalized" : "Session Completed",
            description: hasAnyTies ? "The session has been completed with your selections." : "The session has been marked as completed.",
            variant: "default",
          });
          onOpenChange(false); 
      }

    } catch (error) {
      console.error('Error completing/finalizing session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred while completing the session.",
        variant: "destructive",
      });
    } finally {
      setIsCompletingSession(false);
    }
  }, [
      session?.id,
      isCompletingSession,
      sendCompletionNotification,
      
      tiedMovies, 
      selectedFinalDateEpoch,
      selectedFinalMovieId, 
      hasAnyTies,
      hasDateTies,
      hasMovieTies,
      determinedWinningMovie, 
      onOpenChange
  ]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md mx-auto rounded-2xl border-0 shadow-lg bg-white dark:bg-zinc-900 p-0 overflow-hidden">
        <div className=" px-4 pt-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-medium text-zinc-900 dark:text-white">
              {hasAnyTies ? "Finalize Selection" : "Complete Session"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-500 dark:text-zinc-400 mt-1">
              {hasAnyTies
                ? "Please make the final selections to complete this movie night."
                : "This will finalize the session and notify participants."}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="pb-4 px-4 max-h-[60vh] overflow-y-auto">
          {/* Warnings Section */}
          {hasWarnings && (
            <Alert className="mb-6 border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/20 rounded-xl">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <AlertTitle className="text-amber-700 dark:text-amber-300 font-medium mb-1">Pending Actions</AlertTitle>
                  <AlertDescription className="text-amber-600 dark:text-amber-400 text-sm space-y-1.5">
                    {pendingInviteNames.length > 0 && (
                      <div className="flex items-center">
                        <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Pending invites: <span className="font-medium">{pendingInviteNames.join(', ')}</span></span>
                      </div>
                    )}
                    {awaitingAvailabilityNames.length > 0 && (
                      <div className="flex items-center">
                        <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Awaiting availability: <span className="font-medium">{awaitingAvailabilityNames.join(', ')}</span></span>
                      </div>
                    )}
                    {awaitingVoteNames.length > 0 && (
                      <div className="flex items-center">
                        <ChevronRight className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>Awaiting votes: <span className="font-medium">{awaitingVoteNames.join(', ')}</span></span>
                      </div>
                    )}
                    <div className="pt-1 text-xs italic">You can still complete the session.</div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Tie-breaker sections */}
          {(hasDateTies || hasMovieTies) && (
            <div className="space-y-6">
              {hasDateTies && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                  <Label className="font-medium text-pink dark:text-pink mb-3 block text-sm">Select Final Date & Time</Label>
                  <RadioGroup 
                    value={selectedFinalDateEpoch?.toString()} 
                    onValueChange={(value) => setSelectedFinalDateEpoch(Number(value))} 
                    className="space-y-2"
                  >
                    {tiedDates.map((dateOption) => (
                      
                      <Label
                        key={dateOption.epoch}
                        htmlFor={`date-${dateOption.epoch}`}
                        className="flex items-center space-x-3 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <RadioGroupItem
                          value={dateOption.epoch.toString()}
                          id={`date-${dateOption.epoch}`}
                          disabled={isCompletingSession}
                          className="text-pink dark:text-pink border-zinc-300 dark:border-zinc-600"
                        />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 w-full"> {/* Use span instead of Label */}
                          {dateOption.formatted}
                        </span>
                      </Label> 
                    ))}
                  </RadioGroup>
                </div>
              )}

              {hasMovieTies && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                  <Label className="font-medium text-pink dark:text-pink mb-3 block text-sm">Select Final Movie/Show</Label>
                  <RadioGroup
                    
                    value={selectedFinalMovieId?.toString()}
                    
                    onValueChange={(value) => setSelectedFinalMovieId(Number(value))}
                    className="space-y-2"
                  >
                    {/* Map over tiedMovies (array of objects) */}
                    {tiedMovies.map((movieItem) => (
                      
                      <Label
                        key={movieItem.id} 
                        htmlFor={`movie-${movieItem.id}`} 
                        className="flex items-center space-x-3 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <RadioGroupItem
                          value={movieItem.id.toString()} 
                          id={`movie-${movieItem.id}`} 
                          disabled={isCompletingSession}
                          className="text-pink dark:text-pink border-zinc-300 dark:border-zinc-600"
                        />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 w-full"> {/* Use span instead of Label */}
                          {movieItem.title} {/* Display title */}
                        </span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </div>
          )}

          {/* Final Details Display */}
          {(finalDateDisplay || finalMovieDisplay) && sendCompletionNotification && (
            <div className="mt-6 rounded-xl p-4 border border-pink dark:border-pink">
              <p className="font-medium text-sm mb-2">Notification Details</p>
              <div className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {finalDateDisplay && (
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Time:</span> 
                    <span>{finalDateDisplay}</span>
                  </div>
                )}
                {finalMovieDisplay && (
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Media:</span> 
                    <span>{finalMovieDisplay}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notification Checkbox */}
          <div className="mt-6 flex items-center space-x-3">
            <Checkbox
              id="sendCompletionNotificationDialog" 
              checked={sendCompletionNotification}
              onCheckedChange={(checked) => setSendCompletionNotification(Boolean(checked))}
              disabled={isCompletingSession}
              className="h-5 w-5 rounded-md border-zinc-300 dark:border-zinc-600 focus:ring-pink dark:focus:ring-pink"
            />
            <Label 
              htmlFor="sendCompletionNotificationDialog" 
              className="text-zinc-700 dark:text-zinc-300 text-sm cursor-pointer"
            >
              Notify participants with final details
            </Label>
          </div>
        </div>

        <AlertDialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex md:space-x-3">
          <AlertDialogCancel 
            disabled={isCompletingSession}
            className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDialogConfirmAction} 
            disabled={isCompletingSession}
            className="flex-1 bg-pink hover:bg-pink/90 text-white rounded-xl focus:ring-pink dark:focus:ring-pink focus:ring-offset-0"
          >
            {isCompletingSession ? (
              <div className="flex items-center justify-center">
                <SpinningLoader size={16}  />
                <span className="ml-2">Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                <span>{hasAnyTies ? "Complete Session" : "Confirm"}</span>
              </div>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
