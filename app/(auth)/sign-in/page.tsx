// app/(auth)/signin/page.tsx
'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { toast } from "@/hooks/use-toast";
import { handleAuthError } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext'; // Added AuthContext import
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface SignInData {
  email: string;
  password: string;
}

export default function SignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, initialAuthChecked } = useAuthContext(); // Get user and check status
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/discover'); // Default redirect to /discover

  // Set redirect path from query param on mount
  useEffect(() => {
    const redirectedFrom = searchParams.get('redirectedFrom');
    if (redirectedFrom) {
      setRedirectPath(redirectedFrom);
    }
  }, [searchParams]);

  const handleSubmit = async (data: SignInData) => {
    const { email, password } = data;
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email to proceed.",
          variant: "default", 
        });
        router.push('/verify-email');
        return;
      }

      toast({
        title: "Sign In Successful",
        description: "Welcome back!",
        variant: "default",
      });

      // Get ID token
      const idToken = await user.getIdToken();

      // Call session login API
      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error setting session cookie via API:', errorData);
        handleAuthError(errorData.error || 'Failed to establish session.');
        handleAuthError(errorData.error || 'Failed to establish session.');
        // Don't throw here, just prevent redirect
        return; // Stop execution if session login fails
      }

      // Session cookie set, now navigate to original intended path
      window.location.href = redirectPath;

    } catch (error: unknown) {
      // handleAuthError is called for signInWithEmailAndPassword errors
      // or if the fetch fails and throws
      if (!(error instanceof Error && error.message === "Session login failed")) {
         handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Removed useEffect for redirect, now handled directly in handlers

  return (
    <>
      <CardHeader>
        {/* Reverted title color back to pink gradient */}
        <CardTitle className="text-center text-muted-foreground">
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
          redirectPath={redirectPath} 
        />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pb-8">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              href="/sign-up"
              className="text-pink hover:text-pink/80 transition-colors"
            >
              Sign up
            </Link>
          </span>
        </div>
      </CardFooter>
    </>
  );
}
