'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from "@/hooks/use-toast"; 
import { getAuth, reload, sendEmailVerification, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function VerifyEmail(): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  const handleRefresh = async (): Promise<void> => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser as User;
      await reload(user);
      
      if (user.emailVerified) {
        toast({
          title: "Email Verified",
          description: "Your email has been verified.",
          variant: "default",
        });
        router.push('/sign-in'); // Redirect to sign-in page
      } else {
        toast({
          title: "Email Not Verified",
          description: "Please verify your email to proceed.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error refreshing email verification status:', error);
      toast({
        title: "Error",
        description: "Failed to refresh email verification status.",
        variant: "destructive",
      });
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
      toast({
        title: "Email Sent",
        description: "Verification email has been resent. Please check your inbox.",
        variant: "default", 
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div>
      <CardHeader>
        <CardTitle className="text-center text-muted-foreground">
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
          className="w-full bg-pink text-pink-foreground hover:bg-pink-hover"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend Verification Email'
          )}
        </Button>
      </CardContent>
      <CardFooter className="flex justify-center pb-8">
        <Link 
          href="/sign-in" 
          className="text-pink hover:text-pink/80 transition-colors" 
        >
          ← Go back to sign in
        </Link>
      </CardFooter>
    </div>
  );
}
