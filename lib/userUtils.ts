// lib/userUtils.ts
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ValidationResult {
  isValid: boolean;
  message: string;
}

export const validateUsername = async (username: string): Promise<ValidationResult> => {
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
    // Check availability in database
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', trimmedUsername));
    const querySnapshot = await getDocs(q);
    
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
    console.error('Error checking username availability:', error);
    return {
      isValid: false,
      message: "Error checking username availability"
    };
  }
};
