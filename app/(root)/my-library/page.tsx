// app/(root)/page.tsx
"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { useUserData } from '@/context/UserDataContext';
import NotificationSubscription from '@/components/home/NotificationSubscription';
import { WatchlistOverview } from '@/components/home/WatchlistOverview';
import { CreateSession } from '@/components/home/CreateSession';
import { TopWatchlistStats } from '@/components/home/TopWatchlistStats';

export default function Home() {
  const { userData } = useUserData();

  return (
    <div className="min-h-screen w-full px-4 pt-20 md:px-8 lg:px-10 pb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[2000px] mx-auto space-y-8"
      >
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"> {/* Added flex-col and gap */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"> {/* Responsive font sizes */}
              {userData ? (
                <span>Welcome back, <span className="text-primary">{userData.username}</span></span>
              ) : (
                "Welcome to AFK Cinema"
              )}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Discover, track, and watch together</p> {/* Responsive text size */}
          </div>

          {userData && userData.notification !== "unsupported" && (
            <div>
              <NotificationSubscription />
            </div>
          )}
        </header>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* Left Column - Create Session & Watchlist */}
          <div className="lg:col-span-8 space-y-6 ">
              <CreateSession />

              <WatchlistOverview />
          </div>

          {/* Right Column - Trending Content */}
          <div className="lg:col-span-4">
              <TopWatchlistStats />
          </div>
        </div>
      </motion.div>
    </div>
  );
}