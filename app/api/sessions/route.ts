import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserProfile } from "@/lib/server-auth-utils";
import { adminDb, admin } from "@/lib/firebase-admin"; 
import { DateTimeSelection, UserDate, DatePopularity } from "@/types"; 
import { Friend } from "@/types/user";
import { localSelectionsToUTCEpoch } from "@/lib/dateTimeUtils"; 


const isValidInput = (
  data: unknown
): data is { dates: DateTimeSelection[]; selectedFriends: Friend[] } => {
  return (
    typeof data === 'object' && 
    data !== null &&
    'dates' in data && 
    Array.isArray((data as { dates: unknown }).dates) && 
    'selectedFriends' in data &&
    Array.isArray((data as { selectedFriends: unknown }).selectedFriends) && 
    (data as { dates: unknown[] }).dates.every((d: unknown) =>
      typeof d === 'object' && d !== null && 'date' in d && 'hours' in d && 
      typeof (d as { date: unknown }).date === 'string' && 
      ((d as { hours: unknown }).hours === 'all' || 
        (Array.isArray((d as { hours: unknown }).hours) && 
         (d as { hours: unknown[] }).hours.every((h: unknown) => typeof h === 'number')))
    ) &&
    (data as { selectedFriends: unknown[] }).selectedFriends.every((f: unknown) => 
      typeof f === 'object' && f !== null && 'uid' in f && 'username' in f && 
      typeof (f as { uid: unknown }).uid === 'string' &&
      typeof (f as { username: unknown }).username === 'string'
    )
  ); 
}; 


const getHourKeyFromEpoch = (epoch: number): string => {
  
  if (typeof epoch !== 'number' || isNaN(epoch)) {
    console.warn(`[getHourKeyFromEpoch] Received invalid epoch: ${epoch}`);
    return 'invalid_hour'; 
  }
  const date = new Date(epoch);
  if (isNaN(date.getTime())) {
     console.warn(`[getHourKeyFromEpoch] Failed to create Date from epoch: ${epoch}`);
     return 'invalid_hour';
  }
  return date.getUTCHours().toString();
};



// Calculates aggregated availability based on userDates keyed by userId
// Returns DatePopularity array where 'users' contains userIds
const calculateAggregatedAvailability = (userDates: { [userId: string]: UserDate[] }): DatePopularity[] => {
  const aggregatedPopularity: { [dateEpochKey: string]: Omit<DatePopularity, "hours"> & { hours: Record<string, Omit<DatePopularity["hours"][string], "hourEpoch">> } } = {};

  Object.entries(userDates).forEach(([userId, userDateEntries]) => {
    const dates: UserDate[] = userDateEntries as UserDate[];
    if (!Array.isArray(dates)) {
      console.warn(`[API Aggregation] User ${userId} has malformed userDates (not an array). Skipping.`);
      return;
    }

    dates.forEach((userDate) => {
      if (!userDate || typeof userDate.dateEpoch !== "number" || !("hoursEpoch" in userDate)) {
        console.warn(`[API Aggregation] User ${userId} has malformed UserDate entry: ${JSON.stringify(userDate)}. Skipping.`);
        return;
      }

      const dateEpochKey = userDate.dateEpoch.toString();
      if (!aggregatedPopularity[dateEpochKey]) {
        aggregatedPopularity[dateEpochKey] = {
          dateEpoch: userDate.dateEpoch,
          count: 0,
          users: [],
          hours: {},
        };
      }

      aggregatedPopularity[dateEpochKey].count++;
      // Store userId instead of username
      if (!aggregatedPopularity[dateEpochKey].users.includes(userId)) {
        aggregatedPopularity[dateEpochKey].users.push(userId);
      }

      const processHour = (hourEpoch: number) => {
        const hourKey = getHourKeyFromEpoch(hourEpoch);
        if (!aggregatedPopularity[dateEpochKey].hours[hourKey]) {
          aggregatedPopularity[dateEpochKey].hours[hourKey] = {
            count: 0,
            users: [],
          };
        }
        const hourEntry = aggregatedPopularity[dateEpochKey].hours[hourKey];
        hourEntry.count++;
        // Store userId instead of username
        if (!hourEntry.users.includes(userId)) {
          hourEntry.users.push(userId);
        }
      };

      if (Array.isArray(userDate.hoursEpoch)) {
        userDate.hoursEpoch.forEach((hourEpoch) => {
          if (typeof hourEpoch === "number") {
            processHour(hourEpoch);
          } else {
            console.warn(`[API Aggregation] User ${userId} encountered non-number in hoursEpoch array: ${hourEpoch}. Skipping.`);
          }
        });
      } else {
         console.warn(`[API Aggregation] User ${userId} has unexpected hoursEpoch format (expected array): ${JSON.stringify(userDate.hoursEpoch)}. Skipping date entry.`);
      }
    });
  });

  const finalAggregatedData: DatePopularity[] = Object.values(aggregatedPopularity).map(aggDate => ({
    ...aggDate,
    hours: Object.entries(aggDate.hours).reduce((acc, [hourKey, hourData]) => {
      const hourEpoch = aggDate.dateEpoch + parseInt(hourKey, 10) * 60 * 60 * 1000;
      acc[hourKey] = { ...hourData, hourEpoch };
      return acc;
    }, {} as DatePopularity["hours"])
  })).sort((a: DatePopularity, b: DatePopularity) => {
      
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      
      return a.dateEpoch - b.dateEpoch;
    });

  return finalAggregatedData;
};


export async function POST(request: NextRequest) {
  try {
    const userProfile = await getAuthenticatedUserProfile();
    if (!userProfile || !userProfile.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const creatorUid = userProfile.uid;
    const creatorUsername = userProfile.username;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!isValidInput(body)) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    const { dates: dateSelectionsWithString, selectedFriends }: { dates: DateTimeSelection[]; selectedFriends: Friend[] } = body;

    
    const dateSelectionsWithDateObjects: DateTimeSelection[] = dateSelectionsWithString
      .map(selection => {
        if (typeof selection.date !== 'string') {
           console.warn("Invalid date type received from client:", selection.date);
           return null; 
        }
        const dateObj = new Date(selection.date);
        if (isNaN(dateObj.getTime())) {
          console.warn("Invalid date string received from client:", selection.date);
          return null; 
        }
        return { ...selection, date: dateObj };
      })
      .filter((selection): selection is DateTimeSelection => selection !== null);

    
    const creatorEpochDates = localSelectionsToUTCEpoch(dateSelectionsWithDateObjects);

    const friendsRef = adminDb.doc(`users/${creatorUid}/friends/data`);
    const friendsDoc = await friendsRef.get();
    const actualFriendsList = friendsDoc.exists
      ? friendsDoc.data()?.friendsList || {}
      : {};

    const selectedFriendUids = selectedFriends.map((f: Friend) => f.uid);
    let allSelectedAreFriends = true;
    const nonFriendUids: string[] = [];

    for (const selectedUid of selectedFriendUids) {
      if (!actualFriendsList.hasOwnProperty(selectedUid)) {
        allSelectedAreFriends = false;
        nonFriendUids.push(selectedUid);
      }
    }

    if (!allSelectedAreFriends) {
      console.warn(
        `User ${creatorUid} attempted to create session with non-friends: ${nonFriendUids.join(
          ", "
        )}`
      );
      return NextResponse.json(
        { error: "Cannot create session with non-friends" },
        { status: 403 }
      );
    }

    const participants: Record<
      string,
      { username: string; status: "invited" | "accepted" | "declined" }
    > = {
      [creatorUid]: {
        username: creatorUsername,
        status: "accepted",
      },
    };
    selectedFriends.forEach((friend) => {
      participants[friend.uid] = {
        username: friend.username,
        status: "invited",
      };
    });

    const participantIds = [creatorUid, ...selectedFriendUids];

    // Use creatorUid as the key for initial user dates
    const initialUserDates = {
      [creatorUid]: creatorEpochDates,
    };

    const newSessionData = {
      createdAtEpoch: Date.now(), 
      createdBy: creatorUsername,
      createdByUid: creatorUid,
      userDates: initialUserDates, 
      participants,
      participantIds,
      status: "active",
    };

    const newSessionRef = await adminDb.collection("sessions").add(newSessionData);
    const newSessionId = newSessionRef.id;

    try {
      const initialAggregatedData =
        calculateAggregatedAvailability(initialUserDates);
      const aggregatedDocRef = adminDb
        .collection("sessions")
        .doc(newSessionId)
        .collection("computed")
        .doc("aggregatedAvailability");
      await aggregatedDocRef.set({
        data: initialAggregatedData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (aggError) {
      
      console.error(
        `[${newSessionId}] Error calculating or saving initial aggregated availability:`,
        aggError
      );
    }
    

    return NextResponse.json({ sessionId: newSessionId }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating session via API:", error);
    if (typeof error === "object" && error !== null && "code" in error) {
      console.error(`Firestore Error Code: ${(error as { code: string }).code}`);
    } else if (error instanceof Error) {
      console.error(`Error message: ${error.message}`);
    }
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
