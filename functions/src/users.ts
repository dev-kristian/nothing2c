import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import {QueryDocumentSnapshot} from "firebase-admin/firestore";


if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Cloud Function triggered when a user document in the 'users' collection is updated.
 * Specifically updates the username in the 'participants' map of 'active' sessions
 * the user is part of.
 */
export const updateUsernameInActiveSessions = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    
    if (!event.data) {
      functions.logger.error(
        "updateUsernameInActiveSessions: Event data is missing for onUpdate trigger."
      );
      return null;
    }

    const userId = event.params.userId;
    const beforeSnap = event.data.before as QueryDocumentSnapshot;
    const afterSnap = event.data.after as QueryDocumentSnapshot;
    const beforeData = beforeSnap.data();
    const afterData = afterSnap.data();

    
    const usernameChanged = beforeData?.username !== afterData?.username;
    if (!usernameChanged || !afterData) {
      
      if (!usernameChanged) {
        functions.logger.log(
          `updateUsernameInActiveSessions: User ${userId}: Username did not change. Exiting.`
        );
      } else {
        functions.logger.error(
          `updateUsernameInActiveSessions: User ${userId}: afterData is missing.`
        );
      }
      return null;
    }

    const newUsername = afterData.username;
    functions.logger.log(
      `updateUsernameInActiveSessions: User ${userId}: Username changed to "${newUsername}". Checking active sessions.`
    );

    const batch = db.batch();
    let writeCounter = 0;

    try {
      
      const activeSessionsSnapshot = await db
        .collection("sessions")
        .where("status", "==", "active")
        .where("participantIds", "array-contains", userId)
        .get();

      if (!activeSessionsSnapshot.empty) {
        functions.logger.log(
          `updateUsernameInActiveSessions: User ${userId}: Found ${activeSessionsSnapshot.size} active sessions to update.`
        );
        activeSessionsSnapshot.forEach((sessionDoc) => {
          
          
          const usernameFieldPath = `participants.${userId}.username`;
          batch.update(sessionDoc.ref, {[usernameFieldPath]: newUsername});
          writeCounter++;
        });
      } else {
        functions.logger.log(
          `updateUsernameInActiveSessions: User ${userId}: No active sessions found.`
        );
      }
    } catch (error: unknown) {
      functions.logger.error(
        `updateUsernameInActiveSessions: User ${userId}: Error querying/updating active sessions:`,
        error
      );
      
    }

    
    if (writeCounter > 0) {
      try {
        await batch.commit();
        functions.logger.log(
          `updateUsernameInActiveSessions: User ${userId}: Successfully committed ${writeCounter} session username updates.`
        );
      } catch (error: unknown) {
        functions.logger.error(
          `updateUsernameInActiveSessions: User ${userId}: Failed to commit session update batch:`,
          error
        );
        
      }
    } else {
      functions.logger.log(
        `updateUsernameInActiveSessions: User ${userId}: No session updates to commit.`
      );
    }

    return null;
  }
);
