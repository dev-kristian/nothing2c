'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setUsernameAndClaim } from '@/app/actions/userActions'; 
import { getIdToken } from 'firebase/auth';

function WelcomePage() {
  const [username, setUsername] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const { user, auth } = useAuthContext(); 
  const router = useRouter();

  useEffect(() => {
    if (user === null) { 
      router.replace('/sign-in');
    }
  }, [user, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user || !auth) { 
      setError('Authentication context not available. Please try refreshing.');
      return;
    }

    const finalUsername = username.trim();
    if (!finalUsername) {
      setError('Username cannot be empty.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await setUsernameAndClaim(user.uid, finalUsername);

        if (!result.success) {
          setError(result.message);
          return;
        }

        const freshIdToken = await getIdToken(user, true);

        const response = await fetch('/api/auth/session-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken: freshIdToken }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error refreshing session cookie:', errorData);
          setError('Username set, but failed to refresh session. Please log out and log back in.');
          return;
        }

        window.location.href = '/discover';

      } catch (error) {
        console.error('Error setting username or refreshing session:', error);
        setError('An unexpected error occurred. Please try again.');
      }
    });
  };


  return (
    <div className="space-y-6"> 
      <div className="text-center">
        <p className="text-muted-foreground">
          Choose a username to get started
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase());
              setError(''); 
            }}
            disabled={isPending}
            className="lowercase focus:ring-[pink]"
            maxLength={15}
          />
          {error && (
            <p className="text-sm text-[pink]">
              {error}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Username must be 3-15 characters long and can only contain letters, numbers, and underscores.
          </p>
        </div>
        <Button
          type="submit"
          className="w-full bg-pink text-white hover:bg-pink/90"
          disabled={isPending || !username.trim()}
        >
          {isPending ? "Setting up..." : "Continue"} 
        </Button>
      </form>
    </div> 
  );
}

export default WelcomePage;