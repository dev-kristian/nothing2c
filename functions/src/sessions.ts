import * as functions from "firebase-functions"; // Keep for logger
import * as admin from "firebase-admin";
// Import v2 Firestore trigger and types
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { FirestoreEvent, Change, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
// Corrected path to types relative to the compiled 'lib' folder
import { UserDate, DatePopularity } from "../../types"; 

// Assuming admin is initialized in index.ts
const db = admin.firestore();

// Removed unused interface definitions entirely

// Helper function to get hour key (0-23) from epoch
const getHourKeyFromEpoch = (epoch: number): string => {
  // Create Date object safely, assuming epoch is UTC milliseconds
  return new Date(epoch).getUTCHours().toString();
};

// Use v2 onDocumentUpdated trigger
export const updateAggregatedAvailability = onDocumentUpdated(
  "sessions/{sessionId}",
  async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) => {
    // Ensure event data exists for onUpdate
    if (!event?.data) {
      functions.logger.error("Event data is missing for onUpdate trigger.");
      return null;
    }

    const sessionId = event.params.sessionId;
    const change = event.data; // Get the Change object
    const beforeSnap = change.before;
    const afterSnap = change.after;
    const beforeData = beforeSnap.data();
    const afterData = afterSnap.data();

    // Check if userDates actually changed
    const beforeUserDates = beforeData?.userDates || {};
    const afterUserDates = afterData?.userDates || {};

    // Perform a slightly more reliable check for changes
    // This isn't perfect deep comparison but better than reference check
    if (JSON.stringify(beforeUserDates) === JSON.stringify(afterUserDates)) {
      functions.logger.info(`[${sessionId}] No change detected in userDates based on JSON comparison.`);
      return null;
    }
    
    // Ensure afterData exists (it should for onUpdate)
    if (!afterData) {
      functions.logger.error(`[${sessionId}] afterData is missing in onUpdate event.`);
      return null;
    }

    functions.logger.info(`[${sessionId}] Detected change in userDates. Recalculating aggregated availability.`);

    // --- Recalculate Aggregated Availability ---
    // For simplicity and robustness on initial implementation, let's recalculate
    // the entire aggregation based on the *after* data.
    // Incremental updates (calculating diff) are more complex to get right,
    // especially with the 'all' case and potential race conditions.
    // Recalculating ensures correctness, and for 10-20 users, it's likely fast enough.

    const aggregatedPopularity: { [dateEpochKey: string]: Omit<DatePopularity, "hours"> & { hours: Record<string, Omit<DatePopularity["hours"][string], "hourEpoch">> } } = {};

    // Iterate using userId now
    Object.entries(afterUserDates).forEach(([userId, userDateEntries]) => {
      // Explicitly type dates based on the imported UserDate
      const dates: UserDate[] = userDateEntries as UserDate[];
      if (!Array.isArray(dates)) {
        functions.logger.warn(`[${sessionId}] User ${userId} has malformed userDates (not an array). Skipping.`);
        return;
      }

      dates.forEach((userDate) => {
        // Add more robust validation for the UserDate object structure
        if (!userDate || typeof userDate.dateEpoch !== "number" || !("hoursEpoch" in userDate)) {
          functions.logger.warn(`[${sessionId}] User ${userId} has malformed UserDate entry: ${JSON.stringify(userDate)}. Skipping.`);
          return;
        }

        const dateEpochKey = userDate.dateEpoch.toString();

        // Initialize date entry if it doesn't exist
        if (!aggregatedPopularity[dateEpochKey]) {
          aggregatedPopularity[dateEpochKey] = {
            dateEpoch: userDate.dateEpoch,
            count: 0,
            users: [],
            hours: {},
          };
        }

        // Increment date count and add userId if not present
        aggregatedPopularity[dateEpochKey].count++;
        if (!aggregatedPopularity[dateEpochKey].users.includes(userId)) {
          aggregatedPopularity[dateEpochKey].users.push(userId);
        }

        const processHour = (hourEpoch: number) => {
          const hourKey = getHourKeyFromEpoch(hourEpoch);
          // Initialize hour entry if it doesn't exist
          if (!aggregatedPopularity[dateEpochKey].hours[hourKey]) {
            aggregatedPopularity[dateEpochKey].hours[hourKey] = {
              count: 0,
              users: [],
              // hourEpoch: hourEpoch // Store epoch if needed later, but key is hour string
            };
          }
          // Increment hour count and add userId if not present
          const hourEntry = aggregatedPopularity[dateEpochKey].hours[hourKey]; // Assign for readability
          hourEntry.count++;
          if (!hourEntry.users.includes(userId)) {
            hourEntry.users.push(userId);
          }
        };
        
        // Explicitly type the parameter here
        const processHourTyped = (hourEpoch: number) => {
          processHour(hourEpoch);
        };

        // Since hoursEpoch is now always number[], directly process the array.
        if (Array.isArray(userDate.hoursEpoch)) {
          userDate.hoursEpoch.forEach((hourEpoch) => {
            // Add a check for number type for robustness, although TS should enforce it.
            if (typeof hourEpoch === "number") { 
              processHourTyped(hourEpoch);
            } else {
              // This case should ideally not happen due to type safety, but log just in case.
              functions.logger.warn(`[${sessionId}] User ${userId} encountered non-number in hoursEpoch array: ${hourEpoch}. Skipping.`);
            }
          });
        } else {
           // Log a warning if hoursEpoch is somehow not an array (shouldn't happen with TS)
           functions.logger.warn(`[${sessionId}] User ${userId} has unexpected hoursEpoch format (expected array): ${JSON.stringify(userDate.hoursEpoch)}. Skipping date entry.`);
        }
      });
    });

    // --- Prepare data for Firestore ---
    // Convert the calculated structure back to DatePopularity format for storage
    const finalAggregatedData: DatePopularity[] = Object.values(aggregatedPopularity).map(aggDate => ({
      ...aggDate,
      hours: Object.entries(aggDate.hours).reduce((acc, [hourKey, hourData]) => {
        // Calculate hourEpoch based on dateEpoch and hourKey
        const hourEpoch = aggDate.dateEpoch + parseInt(hourKey, 10) * 60 * 60 * 1000;
        acc[hourKey] = { ...hourData, hourEpoch };
      return acc;
    }, {} as DatePopularity["hours"]) // Explicitly type the accumulator
    // Add explicit types for sort parameters and secondary sort by date
    })).sort((a: DatePopularity, b: DatePopularity) => {
      let sortResult = 0;
      // Primary sort: descending count
      if (b.count !== a.count) {
        sortResult = b.count - a.count;
        functions.logger.info(`[${sessionId}] Sorting by count: a=${a.dateEpoch}(${a.count}), b=${b.dateEpoch}(${b.count}), result=${sortResult}`);
      } else {
        // Secondary sort: ascending dateEpoch (earliest first)
        sortResult = a.dateEpoch - b.dateEpoch;
        functions.logger.info(`[${sessionId}] Sorting by date (counts equal): a=${a.dateEpoch}(${a.count}), b=${b.dateEpoch}(${b.count}), result=${sortResult}`);
      }
      return sortResult;
    });


    // --- Save to Firestore ---
    // Use a subcollection 'computed' to store derived data like this aggregation
    const aggregatedDocRef = db.collection("sessions").doc(sessionId).collection("computed").doc("aggregatedAvailability");

    try {
      // Overwrite the document with the newly calculated aggregation
      // Store the array directly in a 'data' field within the document
      await aggregatedDocRef.set({ // Corrected indentation (8 spaces)
        data: finalAggregatedData, // Corrected indentation (10 spaces)
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      functions.logger.info(`[${sessionId}] Successfully recalculated and saved aggregated availability to computed/aggregatedAvailability.`);
    } catch (error) {
      functions.logger.error(`[${sessionId}] Error saving aggregated availability:`, error);
      // Consider adding retry logic or error reporting mechanisms
      // Re-throwing the error might trigger automatic retries depending on function config
      throw error;
    }

    return null; // Indicate successful execution to Firestore Functions runtime
  }
);
