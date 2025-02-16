// components/AuthForm.tsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import Loader from '@/components/Loader';
import Image from 'next/image';
import { handleGoogleSignIn } from '@/lib/utils';
import { useCustomToast } from '@/hooks/useToast';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { useRouter } from 'next/navigation';
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
  }

  interface FirebaseError {
    code: string;
    message: string;
  }
  
  export default function AuthForm({ 
    isSignUp, 
    onSubmit, 
    onPasswordChange,
    onConfirmPasswordChange,
    onAgreeToTermsChange,
    isSubmitDisabled,
    loading = false
  }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const { showToast } = useCustomToast();
  const router = useRouter();

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
      rememberMe
    });
  };

  const onGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectPath = await handleGoogleSignIn();
      showToast("Google Sign In Successful", "Welcome!", "success");
      router.push(redirectPath);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      const errorMessage = getFirebaseErrorMessage((error as FirebaseError).code);
      showToast("Google Sign In Failed", errorMessage, "error");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Email Input */}
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
            className="bg-secondary border-input"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              className="bg-secondary border-input pr-10"
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

        {/* Confirm Password Input (Sign Up only) */}
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
                className="bg-secondary border-input pr-10"
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

      {/* Remember Me (Sign In only) */}
      {!isSignUp && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <Label htmlFor="remember-me" className="text-sm text-muted-foreground">
            Remember me
          </Label>
        </div>
      )}

      {/* Terms Agreement (Sign Up only) */}
      {isSignUp && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agree-terms"
            required
            checked={agreeToTerms}
            onCheckedChange={handleAgreeToTermsChange}
          />
          <Label htmlFor="agree-terms" className="text-sm text-muted-foreground">
            I agree to the{' '}
            <Link href="/terms" className="text-primary hover:text-primary/80 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors">
              Privacy Policy
            </Link>
          </Label>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitDisabled || loading}
      >
        {loading ? (
          <Loader />
        ) : (
          isSignUp ? 'Sign Up' : 'Sign In'
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-card text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onGoogleSignIn}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader />
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