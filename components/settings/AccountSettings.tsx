'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUserData } from '@/context/UserDataContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator';
import { z } from 'zod';
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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

const validateUsername = (username: string): { isValid: boolean; message?: string } => {
  const trimmedUsername = username.trim().toLowerCase();
  if (!trimmedUsername) return { isValid: false, message: "Username cannot be empty." };
  if (trimmedUsername.length < 3) return { isValid: false, message: "Username must be at least 3 characters." };
  if (trimmedUsername.length > 15) return { isValid: false, message: "Username must be 15 characters or less." };
  if (!/^[a-z0-9_]+$/.test(trimmedUsername)) return { isValid: false, message: "Use only letters, numbers, and underscores." };
  if (/^[0-9]/.test(trimmedUsername)) return { isValid: false, message: "Username cannot start with a number." };
  return { isValid: true };
};

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});


export default function AccountSettings() {
  const { userData, mutateUserData, isLoading: isUserDataLoading } = useUserData();
  const { toast } = useToast();
  const router = useRouter();

  const [newUsername, setNewUsername] = useState('');
  const [isUsernameLoading, setIsUsernameLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameValidationMessage, setUsernameValidationMessage] = useState<string | null>(null);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUsernameInput, setDeleteUsernameInput] = useState('');
  const [deletePasswordInput, setDeletePasswordInput] = useState(''); 
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);


  const originalUsername = userData?.username || '';

  useEffect(() => {
    if (isUsernameModalOpen && userData?.username) {
      setNewUsername(userData.username);
      setUsernameError(null);
      setUsernameValidationMessage(null);
      setIsUsernameLoading(false);
    }
  }, [isUsernameModalOpen, userData?.username]);

  useEffect(() => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordError(null);
      setIsPasswordLoading(false);
  }, [userData]);


  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setNewUsername(value);
    setUsernameError(null);
    const validation = validateUsername(value);
    if (!validation.isValid) {
      setUsernameValidationMessage(validation.message || null);
    } else {
      setUsernameValidationMessage(null);
    }
  };

  const handleUsernameSave = async () => {
    setUsernameError(null);
    setUsernameValidationMessage(null);

    const validation = validateUsername(newUsername);
    if (!validation.isValid) {
      setUsernameValidationMessage(validation.message || "Invalid username.");
      return;
    }

    const finalUsername = newUsername.trim().toLowerCase();

    if (finalUsername === originalUsername) {
      setUsernameValidationMessage("Username hasn't changed.");
      return;
    }

    setIsUsernameLoading(true);
    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newUsername: finalUsername }),
      });
      const result = await response.json();

      if (!response.ok) {
        setUsernameError(result.error || 'Failed to update username.');
        toast({ title: 'Error', description: result.error || 'Failed to update username.', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Username updated successfully!' });
        await mutateUserData();
        setIsUsernameModalOpen(false);
      }
    } catch (err) {
      console.error('Error updating username:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setUsernameError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsUsernameLoading(false);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError(null);
    setIsPasswordLoading(true);

    try {
      const validationResult = passwordChangeSchema.safeParse({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        setPasswordError(`${firstError.path.join('.')}: ${firstError.message}`);
        toast({ title: 'Validation Error', description: firstError.message, variant: 'destructive' });
        return; 
      }

      const auth = getAuth();
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("User not found or email missing.");
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);

      toast({ title: 'Success', description: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordError(null);

    } catch (err: unknown) {
      console.error('Error updating password:', err);
      let errorMessage = 'Failed to update password.';
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const firebaseError = err as { code: string; message: string }; 
        if (firebaseError.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect current password.';
        } else if (firebaseError.code === 'auth/too-many-requests') {
          errorMessage = 'Too many attempts. Please try again later.';
        } else if (firebaseError.message) {
           errorMessage = firebaseError.message; 
        }
      } else if (err instanceof Error) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setPasswordError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

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
          // Type guard for Firebase Auth errors
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


  const isUsernameSaveDisabled = isUsernameLoading || !!usernameValidationMessage || !newUsername || newUsername.trim().toLowerCase() === originalUsername;
  const isPasswordSaveDisabled = isPasswordLoading || !currentPassword || !newPassword || !confirmNewPassword;
  const isDeleteDisabled = isDeleting || !userData || deleteUsernameInput.trim().toLowerCase() !== userData.username?.toLowerCase();

  const auth = getAuth();
  const currentUser = auth.currentUser;
  const hasPasswordProvider = useMemo(() => {
      return currentUser?.providerData.some(p => p.providerId === 'password') ?? false;
  }, [currentUser]);


  return (
    <div className=" mx-auto space-y-4 pb-12">
      <h1 className="text-xl font-bold tracking-tight">Account Settings</h1>
      <p className="text-md text-muted-foreground">Manage your account details and preferences</p>
  
      <section className="rounded-xl bg-card border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">Account Information</h3>
        </div>
  
        <div className="divide-y">
          {/* Username Item */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Username</Label>
              {isUserDataLoading ? (
                <Skeleton className="h-5 w-32 mt-1" />
              ) : (
                <p className="text-sm text-muted-foreground">{userData?.username || 'N/A'}</p>
              )}
            </div>
            <Dialog open={isUsernameModalOpen} onOpenChange={setIsUsernameModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={isUserDataLoading}
                  className="text-pink hover:text-pink hover:bg-pink/10"
                >
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-xl">
                <DialogHeader>
                  <DialogTitle>Change Username</DialogTitle>
                  <DialogDescription>Enter a new username. Must be 3-15 characters, letters, numbers, and underscores only. Cannot start with a number.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="modal-username">Username</Label>
                    <Input
                      id="modal-username"
                      value={newUsername}
                      onChange={handleUsernameChange}
                      className="lowercase"
                      maxLength={15}
                      disabled={isUsernameLoading}
                    />
                  </div>
                  {(usernameError || usernameValidationMessage) && (
                    <p className="text-sm text-destructive">
                      {usernameError || usernameValidationMessage}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
                  <Button
                    type="button"
                    onClick={handleUsernameSave}
                    disabled={isUsernameSaveDisabled}
                    className="bg-pink text-white hover:bg-pink/90"
                  >
                    {isUsernameLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isUsernameLoading ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
  
          {/* Email Row */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Email</Label>
              {isUserDataLoading ? (
                <Skeleton className="h-5 w-48 mt-1" />
              ) : (
                <p className="text-sm text-muted-foreground">{userData?.email || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>
      </section>
  
      {hasPasswordProvider && (
        <section className="rounded-xl bg-card border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium">Password</h3>
          </div>
  
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10 focus-visible:ring-pink"
                    placeholder="Enter your current password"
                    disabled={isPasswordLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
  
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 focus-visible:ring-pink"
                    placeholder="Enter your new password"
                    disabled={isPasswordLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={newPassword} />
              </div>
  
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmNewPassword"
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="pr-10 focus-visible:ring-pink"
                    placeholder="Confirm your new password"
                    disabled={isPasswordLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    aria-label={showConfirmNewPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
  
            {passwordError && (
              <p className="text-sm text-destructive">
                {passwordError}
              </p>
            )}
  
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handlePasswordSave}
                disabled={isPasswordSaveDisabled}
                className="bg-pink text-white hover:bg-pink/90"
              >
                {isPasswordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPasswordLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </section>
      )}
  
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
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                      className="lowercase" 
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
    </div>
  );
}