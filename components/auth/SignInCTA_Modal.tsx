'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, UserPlus, LogIn } from 'lucide-react'; 

interface SignInCTA_ModalProps {
  children: React.ReactNode; 
}

export function SignInCTA_Modal({ children }: SignInCTA_ModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      {/* Stop propagation on the entire content area */}
      <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}> 
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-pink" />
            Unlock Full Features!
          </DialogTitle>
          <DialogDescription className="pt-2">
            Sign in or create an account to save movies to your watchlist, connect with friends, schedule watch parties, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Personalized Watchlist</li>
            <li>Social Features (Friends, Shared Watchlists)</li>
            <li>Watch Together Sessions</li>
            <li>And much more!</li>
          </ul>
        </div>
        <DialogFooter className="gap-2 sm:justify-center"> {/* Centered buttons */}
          {/* Add stopPropagation to prevent card click */}
          <Button asChild variant="outline" onClick={(e) => e.stopPropagation()}> 
            <Link href="/sign-in">
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Link>
          </Button>
          {/* Add stopPropagation to prevent card click */}
          <Button asChild className="bg-pink hover:bg-pink-hover" onClick={(e) => e.stopPropagation()}> 
            <Link href="/sign-up">
              <UserPlus className="mr-2 h-4 w-4" /> Sign Up
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
