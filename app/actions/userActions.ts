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

    // Firestore update successful, now set the custom claim
    await adminAuth.setCustomUserClaims(uid, { setupCompleted: true });

    console.log(`[Server Action] Successfully set username and updated setupCompleted claim for UID: ${uid}`);
    // Return success to signal client-side to refresh session cookie
    return { success: true, message: 'Setup completed successfully. Refreshing session...' };

  } catch (error) {
    // Log error for Firestore update OR claim setting failure
    console.error(`[Server Action] Error completing setup for UID ${uid}:`, error);
    // Do not attempt rollback, just return failure
    return { success: false, message: 'Failed to complete setup. Please try again.' };
  }
};
