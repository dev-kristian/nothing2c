// app/(auth)/signin/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { useCustomToast } from '@/hooks/useToast';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { FirebaseError } from 'firebase/app';

interface SignInData {
  email: string;
  password: string;
}

export default function SignIn() {
  const router = useRouter();
  const { showToast } = useCustomToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: SignInData) => {
    const { email, password } = data;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showToast("Email Not Verified", "Please verify your email to proceed.", "warning");
        router.push('/verify-email');
        return;
      }

      showToast("Sign In Successful", "Welcome back!", "success");
      router.push('/');
    } catch (error: unknown) {
      console.error('Error signing in:', error);
      if (error instanceof FirebaseError) {
        const errorMessage = getFirebaseErrorMessage(error.code);
        showToast("Sign In Failed", errorMessage, "error");
      } else {
        showToast("Sign In Failed", "An unexpected error occurred", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center signin-text">
          Welcome Back!
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Please sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm 
          isSignUp={false} 
          onSubmit={handleSubmit} 
          loading={loading}
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pb-8">
        <div className="text-center">
          <Link 
            href="/forgot-password" 
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Forgot Password?
          </Link>
        </div>
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link 
              href="/sign-up" 
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Sign up
            </Link>
          </span>
        </div>
      </CardFooter>
    </>
  );
}
