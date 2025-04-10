'use server';

import { adminDb } from '@/lib/firebase-admin';

interface ValidationResult {
  isValid: boolean;
  message: string;
}

// Restoring this function as it's needed for username updates in profile settings
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

  // Update max length check to 20
  if (trimmedUsername.length > 20) { 
    return {
      isValid: false,
      message: "Username must be less than 20 characters long"
    };
  }

  // Allow letters, numbers, and underscores, but not starting with a number
  if (!/^[a-z_][a-z0-9_]*$/.test(trimmedUsername)) {
     if (/^[0-9]/.test(trimmedUsername)) {
       return {
         isValid: false,
         message: "Username cannot start with a number"
       };
     }
     return {
       isValid: false,
       message: "Username can only contain letters, numbers, and underscores, and cannot start with a number"
     };
   }


  try {
    const usersRef = adminDb.collection('users');
    // Check against the lowercase username stored in Firestore
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

// Note: setUsernameAndClaim remains removed as it was part of the welcome flow.
