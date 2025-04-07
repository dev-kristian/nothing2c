// app/(auth)/signin/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import { toast } from "@/hooks/use-toast";
import { handleAuthError } from '@/lib/utils'; 
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface SignInData {
  email: string;
  password: string;
}

export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      router.push('/discover');
    } catch (error: unknown) {
      handleAuthError(error); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center signin-text text-pink">
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
            className="text-sm text-pink hover:text-pink/80 transition-colors" 
          >
            Forgot Password?
          </Link>
        </div>
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
