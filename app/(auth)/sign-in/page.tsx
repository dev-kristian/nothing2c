// app/(auth)/signin/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react'; // Import Suspense
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { toast } from "@/hooks/use-toast";
import { handleAuthError } from '@/lib/utils';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for fallback

interface SignInData {
  email: string;
  password: string;
}

// Extracted content component that uses useSearchParams
function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/discover');

  useEffect(() => {
    const redirectedFrom = searchParams.get('redirectedFrom');
    if (redirectedFrom) {
      setRedirectPath(redirectedFrom);
    }
    // Intentionally run only once on mount or when searchParams changes
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

      // Get token and call session login API *before* showing success toast
      const idToken = await user.getIdToken();

      const response = await fetch('/api/auth/session-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error setting session cookie via API:', errorData);
         handleAuthError(errorData.error || 'Failed to establish session.');
         return;
        }
 
        // Show success toast just before navigation
        toast({
          title: "Sign In Successful",
          description: "Welcome back!",
          variant: "default",
        });

        // Use router.push for client-side navigation
        router.push(redirectPath);
 
      } catch (error: unknown) {
      // Avoid duplicate error handling if session login already handled it
      if (!(error instanceof Error && error.message === "Session login failed")) {
         handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
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
            Don&apos;t have an account?{' '}
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

// Main page component wrapping SignInContent with Suspense
export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInContent />
    </Suspense>
  );
}

// Simple fallback component
function SignInFallback() {
  return (
    <>
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full mt-2" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 pb-8">
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </CardFooter>
    </>
  );
}
