'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin'; 
import { FieldValue } from 'firebase-admin/firestore';

interface ValidationResult {
  isValid: boolean;
  message: string;
}


export const checkUsernameAvailability = async (username: string): Promise<ValidationResult> => {
  const trimmedUsername = username.trim().toLowerCase();

  if (!trimmedUsername) {
    return {
      isValid: false,
      message: "Username is required"
    };
  }

  if (trimmedUsername.length < 3) {
    return {
      isValid: false,
      message: "Username must be at least 3 characters long"
    };
  }

  if (trimmedUsername.length > 15) {
    return {
      isValid: false,
      message: "Username must be less than 15 characters long"
    };
  }

  if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
    return {
      isValid: false,
      message: "Username can only contain letters, numbers, and underscores"
    };
  }

  if (/^[0-9]/.test(trimmedUsername)) {
    return {
      isValid: false,
      message: "Username cannot start with a number"
    };
  }

  try {
    const usersRef = adminDb.collection('users');
    const querySnapshot = await usersRef.where('username', '==', trimmedUsername).limit(1).get();

    if (!querySnapshot.empty) {
      return {
        isValid: false,
        message: "This username is already taken"
      };
    }

    return {
      isValid: true,
      message: "Username is available"
    };
  } catch (error) {
    console.error('Error checking username availability (Server Action):', error);
    return {
      isValid: false,
      message: "Error checking username availability. Please try again."
    };
  }
};

interface SetUsernameResult {
  success: boolean;
  message: string;
}

export const setUsernameAndClaim = async (uid: string, username: string): Promise<SetUsernameResult> => {
  if (!uid) {
    return { success: false, message: 'User ID is required.' };
  }

  const validation = await checkUsernameAvailability(username);
  if (!validation.isValid) {
    return { success: false, message: validation.message };
  }

  const finalUsername = username.trim().toLowerCase();

  try {
    const userRef = adminDb.collection('users').doc(uid);
    await userRef.update({
      username: finalUsername,
      setupCompleted: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminAuth.setCustomUserClaims(uid, { hasUsername: true });

    console.log(`[Server Action] Successfully set username and claim for UID: ${uid}`);
    return { success: true, message: 'Username set successfully.' };

  } catch (error) {
    console.error(`[Server Action] Error setting username and claim for UID ${uid}:`, error);
    try {
      const user = await adminAuth.getUser(uid);
      if (user.customClaims?.hasUsername) {
        await adminAuth.setCustomUserClaims(uid, { hasUsername: null }); 
        console.warn(`[Server Action] Rolled back custom claim for UID ${uid} due to error.`);
      }
    } catch (rollbackError) {
       console.error(`[Server Action] Error rolling back custom claim for UID ${uid}:`, rollbackError);
    }
    return { success: false, message: 'Failed to set username. Please try again.' };
  }
};
