// app/(root)/page.tsx
"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { useUserData } from '@/context/UserDataContext';
import NotificationSubscription from '@/components/home/NotificationSubscription';
import { Glass } from '@/components/ui/glass';
import { WatchlistOverview } from '@/components/home/WatchlistOverview';
import { CreateSession } from '@/components/home/CreateSession';
import { TopWatchlistStats } from '@/components/home/TopWatchlistStats';

export default function Home() {
  const { userData } = useUserData();

  return (
    <div className="min-h-screen w-full px-4 pt-12 pb-6 md:px-8 lg:px-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[2000px] mx-auto space-y-8"
      >
        {/* Header Section */}
        <header className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight">
              {userData ? (
                <span>Welcome back, <span className="text-primary">{userData.username}</span></span>
              ) : (
                "Welcome to Kino & Chill"
              )}
            </h1>
            <p className="text-gray-400">Discover, track, and watch together</p>
          </div>
          
          {userData && userData.notification !== "unsupported" && (
            <NotificationSubscription />
          )}
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Create Session & Watchlist */}
          <div className="lg:col-span-8 space-y-6">
            <Glass className="p-6">
              <CreateSession />
            </Glass>
            
            <Glass className="p-6">
              <WatchlistOverview />
            </Glass>
          </div>

          {/* Right Column - Trending Content */}
          <div className="lg:col-span-4">
            <Glass className="p-6 h-full">
              <TopWatchlistStats />
            </Glass>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
