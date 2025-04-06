"use client"

import React, { useState } from 'react';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { WatchlistSection } from '@/components/home/WatchlistSection';
import { CommunitySection } from '@/components/home/CommunitySection';
import { QuickActions } from '@/components/home/QuickActions';
import { UpcomingReleases } from '@/components/home/UpcomingReleases';
import { Bookmark, Users, Calendar } from 'lucide-react';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: 'bookmark' | 'users' | 'calendar';
  label: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'community' | 'upcoming'>('watchlist');

  return (
    <div className="min-h-screen w-full pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
        <section>
          <WelcomeHero />
        </section>
        
        <section>
          <QuickActions />
        </section>
        
        <section className="space-y-5">
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl p-1 bg-gray-5/50 dark:bg-gray-5-dark/50 backdrop-blur-sm">
              <TabButton 
                active={activeTab === 'watchlist'} 
                onClick={() => setActiveTab('watchlist')}
                icon="bookmark"
                label="Watchlist"
              />
              <TabButton 
                active={activeTab === 'community'} 
                onClick={() => setActiveTab('community')}
                icon="users"
                label="Community"
              />
              <TabButton 
                active={activeTab === 'upcoming'} 
                onClick={() => setActiveTab('upcoming')}
                icon="calendar"
                label="Upcoming"
              />
            </div>
          </div>
          
          <div className="min-h-[300px] animate-enter">
            {activeTab === 'watchlist' && <WatchlistSection />}
            {activeTab === 'community' && <CommunitySection />}
            {activeTab === 'upcoming' && <UpcomingReleases />}
          </div>
        </section>
      </div>
    </div>
  );
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label }) => {
  const iconComponents: Record<TabButtonProps['icon'], JSX.Element> = {
    bookmark: <Bookmark size={16} />,
    users: <Users size={16} />,
    calendar: <Calendar size={16} />,
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-white dark:bg-gray-6-dark text-label dark:text-label-dark shadow-apple-sm dark:shadow-apple-dark-sm' 
          : 'text-label-secondary dark:text-label-secondary-dark hover:text-label dark:hover:text-label-dark'
      }`}
    >
      <span className={`${active ? 'text-system-pink dark:text-system-pink-dark' : ''}`}>
        {iconComponents[icon]}
      </span>
      <span>{label}</span>
    </button>
  );
};
