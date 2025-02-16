'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useCustomToast } from '@/hooks/useToast';
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Loader from '@/components/Loader';

const ForgotPasswordPage = (): JSX.Element => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { showToast } = useCustomToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/auth-action`,
        handleCodeInApp: true,
      });
      showToast("Reset Link Sent", "Please check your email to reset your password.", "success");
    } catch (error) {
      console.error('Error sending password reset email:', error);
      showToast("Error", "Failed to send reset link. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center signin-text">
          Forgot Password
        </CardTitle>
        <CardDescription className='text-center text-muted-foreground'>
          Enter your email and we&apos;ll send you instructions to reset your password
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="bg-secondary border-input"
          />
          
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                Sending &nbsp; <Loader />
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex justify-center pb-8">
        <Link 
          href="/sign-in" 
          className="text-primary hover:text-primary/80 transition-colors"
        >
          ← Back to login
        </Link>
      </CardFooter>
    </div>
  );
};

export default ForgotPasswordPage;