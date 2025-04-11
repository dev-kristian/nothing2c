import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (ensure this is done only once)
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Cloud Function triggered when a user document in the 'users' collection is updated.
 * It updates denormalized user data (username, photoURL) in related documents:
 * - Friends' 'friendsList' within 'users/{friendId}/friends/data'
 * - Pending 'friendRequests' sent by the user under 'users/{recipientId}/friendRequests/{userId}'
 */
// Import necessary types for v2 syntax
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {QueryDocumentSnapshot} from "firebase-admin/firestore"; // For change object type

export const updateDenormalizedUserData = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    // Ensure event.data exists for onUpdate triggers
    if (!event.data) {
      functions.logger.error("Event data is missing for onUpdate trigger.");
      return null;
    }

    const userId = event.params.userId;
    const beforeSnap = event.data.before as QueryDocumentSnapshot;
    const afterSnap = event.data.after as QueryDocumentSnapshot;
    const beforeData = beforeSnap.data();
    const afterData = afterSnap.data();

    // Check if username or photoURL actually changed
    // Add null/undefined checks for safety
    const usernameChanged = beforeData?.username !== afterData?.username;
    const photoURLChanged = beforeData?.photoURL !== afterData?.photoURL;

    if (!usernameChanged && !photoURLChanged) {
      functions.logger.log(
        `User ${userId}: No relevant fields changed. Exiting function.`
      );
      return null; // Exit if no relevant fields changed
    }

    // Exit if no relevant fields changed or data is missing
    if (!usernameChanged && !photoURLChanged) {
      functions.logger.log(
        `User ${userId}: No relevant fields changed. Exiting function.`
      );
      return null;
    }
    if (!afterData) {
      functions.logger.error(`User ${userId}: afterData is missing.`);
      return null;
    }

    const newUsername = afterData.username;
    const newPhotoURL = afterData.photoURL || null; // Ensure null if undefined

    functions.logger.log(
      `User ${userId}: Updating denormalized data.`,
      `Username changed: ${usernameChanged}`,
      `PhotoURL changed: ${photoURLChanged}`
    );

    const batch = db.batch();
    let writeCounter = 0;

    // --- 1. Update Friends' Lists ---
    try {
      // Query the 'friendOf' subcollection to find who has this user as a friend
      const friendOfSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("friendOf")
        .get();

      if (!friendOfSnapshot.empty) {
        functions.logger.log(
          `User ${userId}: Found ${friendOfSnapshot.size} friends to update.`
        );
        friendOfSnapshot.forEach((friendDoc) => { // Renamed doc to friendDoc
          const friendId = friendDoc.id;
          const friendDataRef = db
            .collection("users")
            .doc(friendId)
            .collection("friends")
            .doc("data");

          // Construct a nested payload for the specific friend
          const updatePayload: { friendsList: { [key: string]: { username?: string; photoURL?: string | null } } } = {
            friendsList: {
              [userId]: {}, // Target the specific friend's map using the userId variable
            },
          };
            // Add changed fields to the nested payload
          let hasChanges = false;
          if (usernameChanged) {
            updatePayload.friendsList[userId].username = newUsername;
            hasChanges = true;
          }
          if (photoURLChanged) {
            updatePayload.friendsList[userId].photoURL = newPhotoURL;
            hasChanges = true;
          }

          // If there are changes, apply them using set with merge
          if (hasChanges) {
            batch.set(friendDataRef, updatePayload, { merge: true });
            writeCounter++;
          }
        });
      } else {
        functions.logger.log(`User ${userId}: No friends found to update.`);
      }
    } catch (error: unknown) { // Type error as unknown
      functions.logger.error(
        `User ${userId}: Error querying/updating friends' lists:`,
        error // Log the unknown error
      );
      // Decide if you want to stop or continue if this part fails
    }

    // --- 2. Update Pending Sent Friend Requests ---
    try {
      // Query the 'friendRequests' collection group for pending requests sent by this user
      const sentRequestsSnapshot = await db
        .collectionGroup("friendRequests")
        .where("fromUid", "==", userId)
        .where("status", "==", "pending")
        .get();

      if (!sentRequestsSnapshot.empty) {
        functions.logger.log(
          `User ${userId}: Found ${sentRequestsSnapshot.size} pending sent requests to update.`
        );
        sentRequestsSnapshot.forEach((requestDoc) => { // Renamed doc to requestDoc
          const updateData: { fromUsername?: string; fromPhotoURL?: string | null } = {};
          if (usernameChanged) {
            updateData.fromUsername = newUsername;
          }
          if (photoURLChanged) {
            updateData.fromPhotoURL = newPhotoURL;
          }
          // Check if updateData has keys before adding to batch
          if (Object.keys(updateData).length > 0) {
            batch.update(requestDoc.ref, updateData);
            writeCounter++;
          }
        });
      } else {
        functions.logger.log(
          `User ${userId}: No pending sent requests found to update.`
        );
      }
    } catch (error: unknown) { // Type error as unknown
      functions.logger.error(
        `User ${userId}: Error querying/updating sent friend requests:`,
        error // Log the unknown error
      );
      // Decide if you want to stop or continue if this part fails
    }

    // Commit the batch if there are writes
    if (writeCounter > 0) {
      try {
        await batch.commit();
        functions.logger.log(
          `User ${userId}: Successfully committed ${writeCounter} denormalization updates.`
        );
      } catch (error: unknown) { // Type error as unknown
        functions.logger.error(
          `User ${userId}: Failed to commit batch updates:`,
          error // Log the unknown error
        );
        // Handle batch commit failure (e.g., retry logic, logging)
      }
    } else {
      functions.logger.log(`User ${userId}: No updates to commit.`);
    }

    return null;
  });

// You might have other functions here, like the helloWorld example
// import * as logger from "firebase-functions/logger";
// export const helloWorld = functions.https.onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
