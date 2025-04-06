// app/(auth)/signin/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { toast } from "@/hooks/use-toast"; // Import the correct toast function
import { handleAuthError } from '@/lib/utils'; // Import the reusable error handler
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface SignInData {
  email: string;
  password: string;
}

export default function SignIn() {
  const router = useRouter();
  // Remove incorrect useCustomToast usage
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: SignInData) => {
    const { email, password } = data;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        // Use the correct toast function
        toast({
          title: "Email Not Verified",
          description: "Please verify your email to proceed.",
          variant: "default", // Or "warning" if you add that variant style
        });
        router.push('/verify-email');
        return;
      }

      // Use the correct toast function
      toast({
        title: "Sign In Successful",
        description: "Welcome back!",
        variant: "default", // Or "success" if you add that variant style
      });
      router.push('/');
    } catch (error: unknown) {
      // Use the reusable error handler which calls the correct toast function
      handleAuthError(error); 
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
