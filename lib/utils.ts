// lib/utils.ts
import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

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

    const data = await response.json();
    return data.profileCompleted ? '/' : '/';
  } catch (error) {
    console.error('Error checking/creating user profile:', error);
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
    throw error;
  }
};