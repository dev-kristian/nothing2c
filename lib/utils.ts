// lib/utils.ts
import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { getFirebaseErrorMessage } from './firebaseErrors';
import { toast } from "@/hooks/use-toast"; 

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const handleAuthError = (
  error: unknown,
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
