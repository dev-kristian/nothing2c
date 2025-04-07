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

// Removed checkOrCreateUserProfile and handleGoogleSignIn functions
// as this logic is now handled within useAuth hook and AuthForm component.

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
