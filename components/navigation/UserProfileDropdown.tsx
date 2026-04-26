'use client'

import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserProfileDropdownProps {
  user: User | null;
  onSignOut: () => void;
  isSigningOut: boolean;
}

export default function UserProfileDropdown({ user, onSignOut, isSigningOut }: UserProfileDropdownProps) {
  const router = useRouter();

  if (!user) return null;

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          className="flex items-center space-x-1 px-3 py-1.5 rounded-full border border-transparent bg-transparent text-foreground hover:bg-transparent hover:text-pink hover:border-pink focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors duration-150"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="User menu"
        >
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="User avatar"
              width={28}
              height={28}
              className="rounded-full" 
              loading="lazy"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-transparent flex items-center justify-center">
              <UserIcon className="h-6 w-6" />
            </div>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform duration-300`} />
        </motion.button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-56 backdrop-blur-xl bg-background/80 border border-border shadow-lg dark:shadow-none rounded-xl overflow-hidden"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuItem
          className={cn(
            "flex items-center space-x-2 cursor-pointer rounded-sm transition-colors duration-150", // Removed group
            'focus:bg-pink focus:text-primary-foreground hover:bg-pink hover:text-primary-foreground' // Apply hover & focus effect
          )}
          onClick={handleSettingsClick}
        >
          <Settings className="h-4 w-4 mr-2" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          className={cn(
            "flex items-center space-x-2 cursor-pointer rounded-sm transition-colors duration-150", // Removed group
            'focus:bg-pink focus:text-primary-foreground hover:bg-pink hover:text-primary-foreground', // Apply hover & focus effect
            "disabled:opacity-50 disabled:pointer-events-none" 
          )}
          onClick={onSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4 mr-2" /> 
          <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
