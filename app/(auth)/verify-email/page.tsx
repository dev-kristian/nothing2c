'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCustomToast } from '@/hooks/useToast';
import { getAuth, reload, sendEmailVerification, User } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Loader from '@/components/Loader';

export default function VerifyEmail(): JSX.Element {
  const router = useRouter();
  const { showToast } = useCustomToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  const handleRefresh = async (): Promise<void> => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser as User;
      await reload(user);
      
      if (user.emailVerified) {
        showToast("Email Verified", "Your email has been verified.", "success");
        router.push('/welcome');
      } else {
        showToast("Email Not Verified", "Please verify your email to proceed.", "warning");
      }
    } catch (error) {
      console.error('Error refreshing email verification status:', error);
      showToast("Error", "Failed to refresh email verification status.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async (): Promise<void> => {
    setResendLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser as User;
      await sendEmailVerification(user, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/auth-action`,
        handleCodeInApp: true,
      });
      showToast("Email Sent", "Verification email has been resent. Please check your inbox.", "success");
    } catch (error) {
      console.error('Error resending verification email:', error);
      showToast("Error", "Failed to resend verification email.", "error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center signin-text">
          Verify your email
        </CardTitle>
        <CardDescription className='text-center text-muted-foreground'>
          Account activation link sent to your email address.
          Please follow the link inside to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleRefresh}
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              Checking &nbsp; <Loader />
            </>
          ) : (
            'I have verified my email'
          )}
        </Button>
        <Button
          onClick={handleResendVerificationEmail}
          variant="secondary"
          className="w-full"
          disabled={resendLoading}
        >
          {resendLoading ? (
            <>
              Sending &nbsp; <Loader />
            </>
          ) : (
            'Resend Verification Email'
          )}
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center pb-8">
        <Link 
          href="/sign-in" 
          className="text-primary hover:text-primary/80 transition-colors"
        >
          ← Go back to sign in
        </Link>
      </CardFooter>
    </div>
  );
}