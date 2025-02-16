'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword, sendEmailVerification, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { useCustomToast } from '@/hooks/useToast';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, 
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
  rememberMe?: boolean;
  agreeToTerms?: boolean;
}

export default function SignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showToast } = useCustomToast();

  const handleSubmit = async (data: AuthFormData) => {
    const { email, password, confirmPassword } = data;
    
    if (!email || !password || !confirmPassword) {
      showToast("Validation Error", "Please fill in all required fields", "error");
      return;
    }

    try {
      signUpSchema.parse({ email, password, confirmPassword });
      
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await sendEmailVerification(userCredential.user, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/auth-action`,
        handleCodeInApp: true,
      });
      
      showToast("Sign Up Successful", "Verification email sent. Please check your inbox.", "success");
      router.push('/verify-email');
    } catch (error) {
      console.error('Error signing up:', error);
      
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          showToast("Validation Error", err.message, "error");
        });
      } else if (error instanceof Error) {
        const firebaseError = error as AuthError;
        const errorMessage = getFirebaseErrorMessage(firebaseError.code);
        showToast("Sign Up Failed", errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center signin-text">
          Create an Account
        </CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Sign up to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm 
          isSignUp={true} 
          onSubmit={handleSubmit}
          loading={loading}
        />
      </CardContent>
      <CardFooter className="flex justify-center pb-8">
        <span className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link 
            href="/sign-in" 
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        </span>
      </CardFooter>
    </>
  );
}