'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from "@/hooks/use-toast"; // Import the standard toast function
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import SpinningLoader from '@/components/SpinningLoader';

const ForgotPasswordPage = (): JSX.Element => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // Removed useCustomToast hook

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/auth-action`,
        handleCodeInApp: true,
      });
      // Use the standard toast function
      toast({
        title: "Reset Link Sent",
        description: "Please check your email to reset your password.",
        variant: "default", // Or "success" if you have that variant
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      // Use the standard toast function
      toast({
        title: "Error",
        description: "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CardHeader>
        <CardTitle className="text-center text-muted-foreground"> {/* Added text-pink */}
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
            className="w-full bg-pink text-white hover:bg-pink-hover" // Changed text to white
            disabled={loading}
          >
            {loading ? (
              <>
                Sending &nbsp; <SpinningLoader />
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
          className="text-pink hover:text-pink/80 transition-colors"
        >
          ← Back to login
        </Link>
      </CardFooter>
    </div>
  );
};

export default ForgotPasswordPage;
