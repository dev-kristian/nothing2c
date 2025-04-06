// lib/utils.ts
import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getFirebaseErrorMessage } from './firebaseErrors'; // Import the error message utility
import { toast } from "@/hooks/use-toast"; // Import the correct toast function

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const checkOrCreateUserProfile = async (user: User) => {
  try {
    const idToken = await user.getIdToken();
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
      }),
    });

    if (!response.ok) {
      // Log the response body text if it's not JSON
      const errorText = await response.text();
      console.error(`Error from /api/users: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to check/create user profile: ${response.statusText}`);
    }

    const data = await response.json();
    // API returns { profileCompleted: boolean }
    // Always redirect to home page after successful sign-in/profile check.
    // Profile completion checks can be handled elsewhere (e.g., WithAuth HOC).
    console.log(`User profile check/create successful. Profile completed: ${data.profileCompleted}. Redirecting to /`);
    return '/';
  } catch (error) {
    console.error('Error checking/creating user profile:', error);
    // Use handleAuthError for consistency if appropriate, or keep specific logging
    handleAuthError(error, 'Failed to verify user profile. Please try again.');
    return '/';
  }
};

export const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return await checkOrCreateUserProfile(result.user);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    // Consider using handleAuthError here as well if needed
    throw error;
  }
};

/**
 * Handles Firebase authentication errors by displaying a toast notification using the Shadcn UI toast system.
 * @param error The error object caught.
 * @param defaultMessage Optional default message if the error code is not recognized.
 */
export const handleAuthError = (
  error: any,
  defaultMessage: string = 'An unexpected error occurred. Please try again.'
) => {
  let errorMessage = defaultMessage;
  const errorTitle = 'Error'; // Keep title concise for Shadcn toasts

  // Check if it's a Firebase error with a code
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    errorMessage = getFirebaseErrorMessage(error.code);
    // Optionally customize title based on error type if needed
  } else if (error instanceof Error) {
    // Use the error message if it's a standard Error object
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    // Handle plain string errors
    errorMessage = error;
  }

  console.error('Authentication Error:', error); // Keep logging for debugging

  // Use the imported Shadcn UI toast function
  toast({
    title: errorTitle,
    description: errorMessage,
    variant: "destructive", // Use 'destructive' variant for errors
  });
};
