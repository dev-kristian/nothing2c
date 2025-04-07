// lib/utils.ts
import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getFirebaseErrorMessage } from './firebaseErrors';
import { toast } from "@/hooks/use-toast"; 

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
      const errorText = await response.text();
      console.error(`Error from /api/users: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to check/create user profile: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`User profile check/create successful. Profile completed: ${data.profileCompleted}. Redirecting to /discover`);
    return '/discover';
  } catch (error) {
    console.error('Error checking/creating user profile:', error);
    handleAuthError(error, 'Failed to verify user profile. Please try again.');
    return '/discover';
  }
};

export const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return await checkOrCreateUserProfile(result.user);
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const handleAuthError = (
  error: any,
  defaultMessage: string = 'An unexpected error occurred. Please try again.'
) => {
  let errorMessage = defaultMessage;
  const errorTitle = 'Error'; 

  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    errorMessage = getFirebaseErrorMessage(error.code);
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  console.error('Authentication Error:', error);

  toast({
    title: errorTitle,
    description: errorMessage,
    variant: "destructive", 
  });
};
