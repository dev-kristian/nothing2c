import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserProfile } from "@/lib/server-auth-utils";
import { adminDb, admin } from "@/lib/firebase-admin";
import { Session, DatePopularity, Poll } from "@/types";
import { formatEpochToLocalTime } from "@/lib/dateTimeUtils";
import { sendNotificationToRecipients } from '@/lib/notificationUtils';


interface TiedTimeOption {
  epoch: number;
  formatted: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userProfile.uid;
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    
    let requestBody: any = {};
    try {
      requestBody = await request.json();
    } catch (e) {
      
    }

    const sendNotification = typeof requestBody.sendNotification === 'boolean' ? requestBody.sendNotification : false;
    const forceFinalize = typeof requestBody.forceFinalize === 'boolean' ? requestBody.forceFinalize : false;
    const finalDateEpoch = typeof requestBody.finalDateEpoch === 'number' ? requestBody.finalDateEpoch : null;
    const finalMovieTitle = typeof requestBody.finalMovieTitle === 'string' ? requestBody.finalMovieTitle : null;


    const sessionRef = adminDb.collection("sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    
    const sessionData = sessionDoc.data() as Session | undefined;
    if (!sessionData) {
        
        return NextResponse.json({ error: "Session data unavailable" }, { status: 500 });
    }

    
    if (sessionData.createdByUid !== userId) {
      return NextResponse.json({ error: "Forbidden: Only the session creator can complete the session" }, { status: 403 });
    }

    
    if (sessionData.status === "completed") {
        return NextResponse.json({ message: "Session is already completed" }, { status: 200 });
    }

    
    let tiedDateOptions: TiedTimeOption[] = [];
    let tiedMovieOptions: string[] = [];
    let winningDateEpoch: number | null = finalDateEpoch; 
    let winningMovieTitle: string | null = finalMovieTitle; 
    let isTieDetected = false;

    if (!forceFinalize) {
        
        const availabilityDocRef = sessionRef.collection("computed").doc("aggregatedAvailability");
        try {
            const availabilityDoc = await availabilityDocRef.get();
            const availabilityData = availabilityDoc.data()?.data as DatePopularity[] | undefined;

            if (availabilityData && availabilityData.length > 0) {
                const topDate = availabilityData[0];
                let maxHourCount = -1;
                let potentialWinningHours: { key: string; epoch: number }[] = [];

                
                for (const hourData of Object.values(topDate.hours)) {
                    if (hourData.count > maxHourCount) {
                        maxHourCount = hourData.count;
                    }
                }

                
                if (maxHourCount > 0) { 
                    for (const [hourKey, hourData] of Object.entries(topDate.hours)) {
                        if (hourData.count === maxHourCount) {
                            const hourEpoch = topDate.dateEpoch + parseInt(hourKey, 10) * 60 * 60 * 1000;
                            potentialWinningHours.push({ key: hourKey, epoch: hourEpoch });
                        }
                    }
                }

                
                potentialWinningHours.sort((a, b) => a.epoch - b.epoch);

                if (potentialWinningHours.length === 1) {
                    winningDateEpoch = potentialWinningHours[0].epoch;
                } else if (potentialWinningHours.length > 1) {
                    isTieDetected = true;
                    tiedDateOptions = potentialWinningHours.map(h => ({
                        epoch: h.epoch,
                        formatted: formatEpochToLocalTime(h.epoch) 
                    }));
                }
            }
        } catch (availError) {
            console.error(`[${sessionId}] Error fetching/processing availability for tie check:`, availError);
            
        }

        
        const poll = sessionData.poll as Poll | undefined;
        if (poll && poll.votes && Object.keys(poll.votes).length > 0 && poll.movieTitles.length > 0) {
            try {
                const voteCounts: { [title: string]: number } = {};
                poll.movieTitles.forEach(title => { voteCounts[title] = 0; });

                Object.values(poll.votes).forEach((userVoteArray: string[]) => {
                    userVoteArray.forEach(votedTitle => {
                        if (voteCounts.hasOwnProperty(votedTitle)) {
                            voteCounts[votedTitle]++;
                        }
                    });
                });

                let maxVotes = -1;
                let potentialWinningMovies: string[] = [];

                
                for (const count of Object.values(voteCounts)) {
                    if (count > maxVotes) {
                        maxVotes = count;
                    }
                }

                
                if (maxVotes >= 0) { 
                    for (const [title, count] of Object.entries(voteCounts)) {
                        if (count === maxVotes) {
                            potentialWinningMovies.push(title);
                        }
                    }
                }

                
                potentialWinningMovies.sort((a, b) => poll.movieTitles.indexOf(a) - poll.movieTitles.indexOf(b));

                if (potentialWinningMovies.length === 1) {
                    winningMovieTitle = potentialWinningMovies[0];
                } else if (potentialWinningMovies.length > 1) {
                    isTieDetected = true;
                    tiedMovieOptions = potentialWinningMovies;
                } else if (potentialWinningMovies.length === 0 && poll.movieTitles.length > 0) {
                    
                    
                    if (poll.movieTitles.length > 1) {
                        isTieDetected = true;
                        tiedMovieOptions = poll.movieTitles; 
                    } else {
                        winningMovieTitle = poll.movieTitles[0]; 
                    }
                }

            } catch (pollError) {
                console.error(`[${sessionId}] Error processing poll votes for tie check:`, pollError);
                
            }
        }
    } 


    
    if (!forceFinalize && isTieDetected) {
        console.log(`[${sessionId}] Tie detected. Dates: ${tiedDateOptions.length}, Movies: ${tiedMovieOptions.length}`);
        return NextResponse.json(
            { status: 'tie_detected', tiedDates: tiedDateOptions, tiedMovies: tiedMovieOptions },
            { status: 202 } 
        );
    }

    
    console.log(`[${sessionId}] Proceeding with finalization. Force: ${forceFinalize}`);

    
    if (forceFinalize) {
        if (tiedDateOptions.length > 1 && finalDateEpoch === null) {
             return NextResponse.json({ error: 'Final date selection is required due to a tie.' }, { status: 400 });
        }
        if (tiedMovieOptions.length > 1 && finalMovieTitle === null) {
             return NextResponse.json({ error: 'Final movie selection is required due to a tie.' }, { status: 400 });
        }
        
        winningDateEpoch = finalDateEpoch;
        winningMovieTitle = finalMovieTitle;
    }


    
    await sessionRef.update({
      status: "completed",
      completedAtEpoch: admin.firestore.FieldValue.serverTimestamp(),
      
      finalChoice: {
          dateEpoch: winningDateEpoch,
          movieTitle: winningMovieTitle,
      }
    });
    console.log(`[${sessionId}] Session status updated to completed.`);


    
    if (sendNotification) {
        
        const notificationTitle = "Session Finalized!";
        let notificationBody = "Movie Night details are set!";
        const formattedWinningTime = winningDateEpoch ? formatEpochToLocalTime(winningDateEpoch) : null;

        if (winningMovieTitle && formattedWinningTime) {
          notificationBody = `Watch '${winningMovieTitle}' on ${formattedWinningTime}.`;
        } else if (winningMovieTitle) {
          notificationBody = `The winning movie is '${winningMovieTitle}'. Time TBD.`;
        } else if (formattedWinningTime) {
          notificationBody = `The winning time is ${formattedWinningTime}. Movie TBD.`;
        } else {
          
          notificationBody = "The session details have been finalized.";
        }


        const recipients = (sessionData.participantIds || []).filter(id => id !== userId);

        if (recipients.length > 0) {
          const clickAction = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/watch-together/${sessionId}`;
          // Construct enhanced payload
          const notificationPayload = {
            title: notificationTitle,
            body: notificationBody,
            icon: '/icon-192x192.png', // Standard icon
            image: '/images/notification-banner.jpg', // Placeholder banner image URL
            badge: '/icons/badge-monochrome.png', // Placeholder badge icon URL
            tag: sessionId, // Use sessionId to group/replace notifications
            clickAction: clickAction, // URL for default click and service worker
            actions: [ // Add action buttons
              { action: 'view_session', title: 'View Session' },
              // { action: 'dismiss', title: 'Dismiss' } // Optional dismiss action
            ]
          };

          console.log(`[${sessionId}] Attempting to send completion notification to ${recipients.length} recipients.`);
          
          const notificationResult = await sendNotificationToRecipients(recipients, notificationPayload);

          if (notificationResult.failureCount > 0) {
            console.error(`[${sessionId}] Failed to send completion notification to ${notificationResult.failureCount} recipients. Errors:`, notificationResult.errors);
          } else {
            console.log(`[${sessionId}] Completion notification sent successfully to ${notificationResult.successCount} recipients.`);
          }
        } else {
            console.log(`[${sessionId}] No recipients to notify for completion.`);
        }
    } else {
        console.log(`[${sessionId}] Skipping completion notification as requested.`);
    }
    

    return NextResponse.json({ message: "Session completed successfully" }, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error completing session ${params.sessionId}:`, error);
    if (typeof error === "object" && error !== null && "code" in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}
