'use client';

import { useState, useTransition } from 'react'; // Added useTransition
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { checkUsernameAvailability } from '@/app/actions/userActions'; // Import Server Action
// Removed WithProfileUncompleted import

function WelcomePage() {
  const [username, setUsername] = useState('');
  const [isPending, startTransition] = useTransition(); // Use transition hook
  const [error, setError] = useState('');
  const { user } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to complete setup');
      return;
    }

    setError('');

    startTransition(async () => { // Wrap logic in startTransition
      try {
        const validation = await checkUsernameAvailability(username); // Call Server Action

        if (!validation.isValid) {
          setError(validation.message);
          return;
        }

        const userRef = doc(db, 'users', user.uid);
      
        await updateDoc(userRef, {
          username: username.trim().toLowerCase(),
          setupCompleted: true,
          updatedAt: serverTimestamp(),
        });

        router.replace('/');

      } catch (error) {
        console.error('Error updating profile:', error);
        setError('Failed to update profile. Please try again.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to Nothing<sup>2C</sup>!</h1>
        <p className="text-muted-foreground mt-2">
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
              setError(''); // Clear error when user types
            }}
            disabled={isPending} // Use isPending for disabled state
            className="lowercase"
            maxLength={15}
          />
          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Username must be 3-15 characters long and can only contain letters, numbers, and underscores.
          </p>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || !username.trim()} // Use isPending for disabled state
        >
          {isPending ? "Setting up..." : "Continue"} {/* Use isPending for button text */}
        </Button>
      </form>
    </div>
  );
}

// Removed WithProfileUncompleted HOC wrapper
export default WelcomePage;
