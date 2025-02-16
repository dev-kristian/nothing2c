// app/(auth)/auth-action/page.tsx
'use client'

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode, confirmPasswordReset } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Loader from '@/components/Loader';
import { Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useCustomToast } from '@/hooks/useToast';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function AuthActionContent() {
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mode, setMode] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const verificationInitiated = useRef(false);
  const { showToast } = useCustomToast();
  const { user } = useAuthContext();

  useEffect(() => {
    const handleEmailVerification = async (oobCode: string) => {
      try {
        await applyActionCode(auth, oobCode);
        setVerificationStatus('success');
        showToast("Email Verified", "Your email has been successfully verified.", "success");

        if (user) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userData = {
              uid: user.uid,
              email: user.email,
              createdAt: serverTimestamp(),
              username: "",
            };
            await setDoc(userDocRef, userData, { merge: true });
          } catch (firestoreError) {
            console.error("Error writing to Firestore:", firestoreError);
            showToast("Firestore Error", "Failed to update user data.", "error");
          }
        }

        setTimeout(() => router.push('/sign-in'), 3000);
      } catch (error) {
        console.error('Error verifying email:', error);
        setVerificationStatus('error');
        showToast("Verification Failed", "Unable to verify your email.", "error");
      } finally {
        setLoading(false);
      }
    };

    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode && oobCode && !verificationInitiated.current) {
      setMode(mode);
      setOobCode(oobCode);
      verificationInitiated.current = true;
      if (mode === 'verifyEmail') {
        handleEmailVerification(oobCode);
      } else {
        setLoading(false);
      }
    } else if (!mode || !oobCode) {
      setVerificationStatus('invalid');
      setLoading(false);
    }
  }, [searchParams, showToast, router, user]);

  useEffect(() => {
    try {
      passwordSchema.parse({ password, confirmPassword });
      setIsFormValid(true);
    } catch (error) {
      console.error('Password validation error:', error);
      setIsFormValid(false);
    }
  }, [password, confirmPassword]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      passwordSchema.parse({ password, confirmPassword });
      await confirmPasswordReset(auth, oobCode, password);
      setVerificationStatus('passwordResetSuccess');
      showToast("Password Reset Successful", "Your password has been successfully reset.", "success");
      setTimeout(() => router.push('/sign-in'), 3000);
    } catch (error) {
      console.error('Error resetting password:', error);
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          showToast("Validation Error", err.message, "error");
        });
      } else {
        setVerificationStatus('passwordResetError');
        showToast("Password Reset Failed", "An error occurred while resetting your password.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  if (mode === 'verifyEmail') {
    return (
      <div>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center signin-text">
            Email Verification
          </CardTitle>
          <CardDescription className='text-center text-muted-foreground'>
            {verificationStatus === 'success'
              ? "Your email has been successfully verified. Redirecting to sign-in page..."
              : verificationStatus === 'error'
                ? "Unable to verify your email. Please try again or contact support."
                : verificationStatus === 'invalid'
                  ? "The link is invalid or has expired."
                  : "Verifying your email..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {verificationStatus === 'error' || verificationStatus === 'invalid' ? (
            <div className="mt-4 text-center">
              <Link
                href="/sign-in"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                ← Back to login
              </Link>
            </div>
          ) : null}
        </CardContent>
      </div>
    );
  }

  if (mode === 'resetPassword') {
    return (
      <div>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center signin-text">
            Reset Password
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  className="bg-secondary border-input pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <PasswordStrengthIndicator password={password} />
            </div>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="bg-secondary border-input pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <>
                  Resetting Password   <Loader />
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </CardContent>
      </div>
    );
  }

  return null;
}

function AuthAction() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader />
        </div>
      }
    >
      <AuthActionContent />
    </Suspense>
  );
}

export default AuthAction;