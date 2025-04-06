"use client"

import { useRouter } from 'next/navigation';
import { Users, Film, Tv, Settings } from 'lucide-react';

export function QuickActions() {
  const router = useRouter();
  
  const actions = [
    {
      title: "Watch Party",
      description: "Plan a movie night with friends",
      icon: <Users size={20} />,
      onClick: () => router.push('/watch-together?new=true')
    },
    {
      title: "Movies",
      description: "Discover new films to watch",
      icon: <Film size={20} />,
      onClick: () => router.push('/explore?type=movie')
    },
    {
      title: "TV Shows",
      description: "Find your next binge-worthy series",
      icon: <Tv size={20} />,
      onClick: () => router.push('/explore?type=tv')
    },
    {
      title: "Settings",
      description: "Customize your experience",
      icon: <Settings size={20} />,
      onClick: () => router.push('/settings')
    }
  ];
  
  return (
    <div className="flex flex-wrap gap-3 sm:gap-4">
      {actions.map((action) => (
        <button
          key={action.title}
          onClick={action.onClick}
          className="w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)] flex flex-col items-center text-center
                    bg-white/50 dark:bg-gray-6-dark/50 backdrop-blur-sm
                    rounded-xl p-4 sm:p-5 
                    transition-all duration-200
                    hover:bg-white/70 dark:hover:bg-gray-6-dark/70"
        >
          <div className="text-gray dark:text-gray-dark mb-3">
            {action.icon}
          </div>
          <h3 className="font-medium text-sm mb-0.5">{action.title}</h3>
          <p className="text-xs text-label-secondary dark:text-label-secondary-dark">{action.description}</p>
        </button>
      ))}
    </div>
  );
}
