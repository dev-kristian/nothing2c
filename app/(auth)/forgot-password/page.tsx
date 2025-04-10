'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
 import { sendPasswordResetEmail } from 'firebase/auth';
 import { auth } from '@/lib/firebase';
 import { toast } from "@/hooks/use-toast";
 import { handleAuthError } from '@/lib/utils'; // Import handleAuthError
 import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react'; // Import Loader2
// Removed SpinningLoader import

const ForgotPasswordPage = (): JSX.Element => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/auth-action`,
        handleCodeInApp: true,
      });
      toast({
        title: "Reset Link Sent",
        description: "Please check your email to reset your password.",
        variant: "default",
       });
     } catch (error) {
       // Use handleAuthError for consistent error feedback
       handleAuthError(error, "Failed to send reset link. Please try again.");
     } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CardHeader>
        <CardTitle className="text-center text-muted-foreground">
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
            className="w-full bg-pink text-white hover:bg-pink-hover"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {loading ? 'Sending...' : 'Send Reset Link'}
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
