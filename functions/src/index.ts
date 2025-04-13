import * as functions from "firebase-functions";
import * as admin from "firebase-admin";


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

import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {QueryDocumentSnapshot} from "firebase-admin/firestore"; 


import { updateAggregatedAvailability } from "./sessions";

import { updateUsernameInActiveSessions } from "./users";

export const updateDenormalizedUserData = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    
    if (!event.data) {
      functions.logger.error("Event data is missing for onUpdate trigger.");
      return null;
    }

    const userId = event.params.userId;
    const beforeSnap = event.data.before as QueryDocumentSnapshot;
    const afterSnap = event.data.after as QueryDocumentSnapshot;
    const beforeData = beforeSnap.data();
    const afterData = afterSnap.data();

    
    
    const usernameChanged = beforeData?.username !== afterData?.username;
    const photoURLChanged = beforeData?.photoURL !== afterData?.photoURL;

    if (!usernameChanged && !photoURLChanged) {
      functions.logger.log(
        `User ${userId}: No relevant fields changed. Exiting function.`
      );
      return null; 
    }

    
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
    const newPhotoURL = afterData.photoURL || null; 

    functions.logger.log(
      `User ${userId}: Updating denormalized data.`,
      `Username changed: ${usernameChanged}`,
      `PhotoURL changed: ${photoURLChanged}`
    );

    const batch = db.batch();
    let writeCounter = 0;

    
    try {
      
      const friendOfSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("friendOf")
        .get();

      if (!friendOfSnapshot.empty) {
        functions.logger.log(
          `User ${userId}: Found ${friendOfSnapshot.size} friends to update.`
        );
        friendOfSnapshot.forEach((friendDoc) => { 
          const friendId = friendDoc.id;
          const friendDataRef = db
            .collection("users")
            .doc(friendId)
            .collection("friends")
            .doc("data");

          
          const updatePayload: { friendsList: { [key: string]: { username?: string; photoURL?: string | null } } } = {
            friendsList: {
              [userId]: {}, 
            },
          };
            
          let hasChanges = false;
          if (usernameChanged) {
            updatePayload.friendsList[userId].username = newUsername;
            hasChanges = true;
          }
          if (photoURLChanged) {
            updatePayload.friendsList[userId].photoURL = newPhotoURL;
            hasChanges = true;
          }

          
          if (hasChanges) {
            batch.set(friendDataRef, updatePayload, { merge: true });
            writeCounter++;
          }
        });
      } else {
        functions.logger.log(`User ${userId}: No friends found to update.`);
      }
    } catch (error: unknown) { 
      functions.logger.error(
        `User ${userId}: Error querying/updating friends' lists:`,
        error 
      );
      
    }
    try {
      
      const sentRequestsSnapshot = await db
        .collectionGroup("friendRequests")
        .where("fromUid", "==", userId)
        .where("status", "==", "pending")
        .get();

      if (!sentRequestsSnapshot.empty) {
        functions.logger.log(
          `User ${userId}: Found ${sentRequestsSnapshot.size} pending sent requests to update.`
        );
        sentRequestsSnapshot.forEach((requestDoc) => { 
          const updateData: { fromUsername?: string; fromPhotoURL?: string | null } = {};
          if (usernameChanged) {
            updateData.fromUsername = newUsername;
          }
          if (photoURLChanged) {
            updateData.fromPhotoURL = newPhotoURL;
          }
          
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
    } catch (error: unknown) { 
      functions.logger.error(
        `User ${userId}: Error querying/updating sent friend requests:`,
        error 
      );
      
    }

    
    if (writeCounter > 0) {
      try {
        await batch.commit();
        functions.logger.log(
          `User ${userId}: Successfully committed ${writeCounter} denormalization updates.`
        );
      } catch (error: unknown) { 
        functions.logger.error(
          `User ${userId}: Failed to commit batch updates:`,
          error 
        );
        
      }
    } else {
      functions.logger.log(`User ${userId}: No updates to commit.`);
    }

    return null;
  });


export { updateAggregatedAvailability };

export { updateUsernameInActiveSessions };








