'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { UserData } from '@/types/user';

interface DeleteAccountSectionProps {
  userData: UserData | null | undefined;
  isUserDataLoading: boolean;
  hasPasswordProvider: boolean;
}

export default function DeleteAccountSection({ userData, isUserDataLoading, hasPasswordProvider }: DeleteAccountSectionProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUsernameInput, setDeleteUsernameInput] = useState('');
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setDeleteError(null);

    if (!userData || deleteUsernameInput.trim().toLowerCase() !== userData.username?.toLowerCase()) {
      setDeleteError("Username confirmation does not match.");
      return;
    }

    setIsDeleting(true);
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setDeleteError("User not found. Please sign in again.");
      setIsDeleting(false);
      return;
    }

    try {
      if (hasPasswordProvider) {
        if (!deletePasswordInput) {
          setDeleteError("Password is required to confirm deletion.");
          setIsDeleting(false);
          return;
        }
        if (!user.email) {
           setDeleteError("User email not found for re-authentication.");
           setIsDeleting(false);
           return;
        }
        const credential = EmailAuthProvider.credential(user.email, deletePasswordInput);
        try {
          await reauthenticateWithCredential(user, credential);
        } catch (reauthError: unknown) {
          console.error("Re-authentication failed:", reauthError);
          let errMsg = "Re-authentication failed. Please check your password.";
          if (typeof reauthError === 'object' && reauthError !== null && 'code' in reauthError) {
             const firebaseError = reauthError as { code: string; message: string };
             if (firebaseError.code === 'auth/wrong-password') {
                errMsg = 'Incorrect password.';
             } else if (firebaseError.code === 'auth/too-many-requests') {
                errMsg = 'Too many attempts. Please try again later.';
             } else if (firebaseError.message) {
                errMsg = firebaseError.message;
             }
          } else if (reauthError instanceof Error) {
             errMsg = reauthError.message;
          }
          setDeleteError(errMsg);
          setIsDeleting(false);
          return;
        }
      }

      const response = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Failed to delete account. Please try again.' }));
        throw new Error(result.error || 'Failed to delete account on server.');
      }

      toast({ title: 'Success', description: 'Account deleted successfully.' });
      await signOut(auth);
      router.push('/');

    } catch (err: unknown) {
      console.error('Error deleting account:', err);
      let errMsg = 'An unexpected error occurred during deletion.';
      if (err instanceof Error) {
        errMsg = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string') {
        errMsg = err.message;
      }
      setDeleteError(errMsg);
      toast({ title: 'Error', description: errMsg, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeleteDisabled = isDeleting || !userData || deleteUsernameInput.trim().toLowerCase() !== userData.username?.toLowerCase() || (hasPasswordProvider && !deletePasswordInput);


  return (
    <section className="rounded-xl bg-card border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-medium text-destructive">Account Deletion</h3>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1 max-w-lg">
            <p className="text-base font-medium">Delete Your Account</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) { 
              setDeleteUsernameInput('');
              setDeletePasswordInput('');
              setDeleteError(null);
              setIsDeleting(false);
            }
          }}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={isUserDataLoading}
              >
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] rounded-xl">
              <DialogHeader>
                <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                <DialogDescription>
                  This action is irreversible. All your data, including profile information, watchlist, and settings will be permanently lost.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="delete-username">
                    To confirm, type your username (<span className="font-mono text-sm">{userData?.username || 'your username'}</span>):
                  </Label>
                  <Input
                    id="delete-username"
                    value={deleteUsernameInput}
                    onChange={(e) => setDeleteUsernameInput(e.target.value)}
                    placeholder="Enter your username"
                    className="lowercase focus-visible:ring-destructive"
                    disabled={isDeleting}
                  />
                </div>

                {hasPasswordProvider && (
                  <div className="space-y-2">
                    <Label htmlFor="delete-password">Enter your current password:</Label>
                    <div className="relative">
                      <Input
                        id="delete-password"
                        type={showDeletePassword ? "text" : "password"}
                        value={deletePasswordInput}
                        onChange={(e) => setDeletePasswordInput(e.target.value)}
                        placeholder="Enter your current password"
                        className="pr-10 focus-visible:ring-destructive"
                        disabled={isDeleting}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        aria-label={showDeletePassword ? "Hide password" : "Show password"}
                      >
                        {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {deleteError && (
                  <p className="text-sm text-destructive">
                    {deleteError}
                  </p>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" disabled={isDeleting}>Cancel</Button>
                </DialogClose>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleteDisabled}
                >
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isDeleting ? 'Deleting...' : 'Delete Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
