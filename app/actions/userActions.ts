'use server';

import { adminDb } from '@/lib/firebase-admin';

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

  
  if (trimmedUsername.length > 20) { 
    return {
      isValid: false,
      message: "Username must be less than 20 characters long"
    };
  }

  
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


