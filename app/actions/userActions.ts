'use server';

import { adminDb } from '@/lib/firebase-admin'; // Assuming admin DB is initialized here

interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Validates a username format and checks its availability in Firestore using the Admin SDK.
 * To be called from client components as a Server Action.
 * @param username The username string to validate.
 * @returns ValidationResult object.
 */
export const checkUsernameAvailability = async (username: string): Promise<ValidationResult> => {
  // Trim and convert to lowercase
  const trimmedUsername = username.trim().toLowerCase();

  // Check if empty
  if (!trimmedUsername) {
    return {
      isValid: false,
      message: "Username is required"
    };
  }

  // Check length
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

  // Check format (letters, numbers, underscores only)
  if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
    return {
      isValid: false,
      message: "Username can only contain letters, numbers, and underscores"
    };
  }

  // Check if username starts with a number
  if (/^[0-9]/.test(trimmedUsername)) {
    return {
      isValid: false,
      message: "Username cannot start with a number"
    };
  }

  try {
    // Check availability in database using Admin SDK
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
    // Avoid leaking internal error details to the client
    return {
      isValid: false,
      message: "Error checking username availability. Please try again."
    };
  }
};
