import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
// Removed SpinningLoader import
import Image from 'next/image';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from "@/hooks/use-toast";
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { AuthFormData } from '@/types';

  interface AuthFormProps {
    isSignUp: boolean;
    onSubmit: (data: AuthFormData) => void;
    onPasswordChange?: (password: string) => void;
    onConfirmPasswordChange?: (confirmPassword: string) => void;
    onAgreeToTermsChange?: (agreed: boolean) => void;
    isSubmitDisabled?: boolean;
    loading?: boolean;
    redirectPath?: string;
  }

  export default function AuthForm({ 
    isSignUp, 
    onSubmit, 
    onPasswordChange,
    onConfirmPasswordChange,
    onAgreeToTermsChange,
    isSubmitDisabled,
    loading = false,
    redirectPath = '/'
  }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter(); // Initialize useRouter

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (onPasswordChange) {
      onPasswordChange(newPassword);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    if (onConfirmPasswordChange) {
      onConfirmPasswordChange(newConfirmPassword);
    }
  };

  const handleAgreeToTermsChange = (checked: boolean) => {
    setAgreeToTerms(checked);
    if (onAgreeToTermsChange) {
      onAgreeToTermsChange(checked);
    }
  };
  

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      email,
      password,
      ...(isSignUp && {
        confirmPassword,
        agreeToTerms
      }),
    });
  };

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user) {
        const idToken = await user.getIdToken();

        const response = await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error setting session cookie via API:', errorData);
          toast({
            title: "Sign In Error",
            description: "Failed to establish session. Please try again.",
            variant: "destructive",
          });
          return; 
        }

        toast({
          title: "Google Sign In Successful",
          description: "Welcome!",
          variant: "default",
        });
        router.push(redirectPath); 

      } else {
         console.log("Google Sign In popup closed or did not return a user.");
         toast({
            title: "Google Sign In Cancelled",
          variant: "default",
         });
      }
    } catch (error: unknown) {
      console.error('Error during Google Sign In or session setup:', error);
      let errorCode = 'unknown';
      if (typeof error === 'object' && error !== null && 'code' in error) {
        errorCode = (error as { code: string }).code;
      }

      if (!(error instanceof Error && error.message === "Session login failed")) {
         const errorMessage = getFirebaseErrorMessage(errorCode);
         toast({
            title: "Google Sign In Failed",
            description: errorMessage,
            variant: "destructive",
         });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="bg-secondary border-input focus:ring-pink"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-sm">
              Password
            </Label>
            {!isSignUp && (
              <Link
                href="/forgot-password"
                className="text-sm text-pink hover:text-pink/80 transition-colors"
              >
                Forgot Password?
              </Link>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              className="bg-secondary border-input pr-10 focus:ring-pink"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
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
          {isSignUp && <PasswordStrengthIndicator password={password} />}
        </div>

        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="bg-secondary border-input pr-10 focus:ring-pink"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
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
          </div>
        )}
      </div>

      {isSignUp && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agree-terms"
            required
            checked={agreeToTerms}
            onCheckedChange={handleAgreeToTermsChange}
            className="data-[state=checked]:bg-pink data-[state=checked]:text-pink-foreground data-[state=checked]:border-pink" // Added pink classes
          />
          <Label htmlFor="agree-terms" className="text-sm text-muted-foreground">
            I agree to the{' '}
            <Link href="/terms" className="text-pink hover:text-pink/80 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-pink hover:text-pink/80 transition-colors">
              Privacy Policy
            </Link>
          </Label>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-pink text-white hover:bg-pink/90"
        disabled={isSubmitDisabled || loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onGoogleSignIn}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <div className="flex items-center justify-center">
            <Image
              src="/icons/google.svg"
              alt="Google"
              width={20}
              height={20}
              className="mr-2"
            />
            <span className="google-text">Continue with Google</span>
          </div>
        )}
      </Button>
    </form>
  );
}
