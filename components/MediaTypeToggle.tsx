// components/MediaTypeToggle.tsx
'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Film, Tv, Calendar } from 'lucide-react';
import { DiscoverMediaType } from '@/lib/fetchers';

interface MediaTypeToggleProps {
  mediaType: DiscoverMediaType;
  onMediaTypeChange: (type: DiscoverMediaType) => void;
  size?: 'default' | 'sm';
  showUpcoming?: boolean;
}

export default function MediaTypeToggle({
  mediaType,
  onMediaTypeChange,
  size = 'default',
  showUpcoming = false
}: MediaTypeToggleProps) {
  const isSmall = size === 'sm' 

  return (
    <div
      className={`
        frosted-panel  rounded-full flex items-center
        text-xs sm:text-sm
      `}
    >
      <ToggleButton
        active={mediaType === 'movie'}
        onClick={() => onMediaTypeChange('movie')}
        size={size}
        isSmall={isSmall}
      >
        <Film className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'}  'mr-1' `} />
        <span className='pl-1'>Movies</span>
      </ToggleButton>

      <ToggleButton
        active={mediaType === 'tv'}
        onClick={() => onMediaTypeChange('tv')}
        size={size}
        isSmall={isSmall}
      >
        <Tv className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} 'mr-1'`} />
        <span className='pl-1'>TV Shows</span>
      </ToggleButton>

      {showUpcoming && (
        <ToggleButton
          active={mediaType === 'upcoming'}
          onClick={() => onMediaTypeChange('upcoming')}
          size={size}
          isSmall={isSmall}
        >
          <Calendar className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4' }  `} />
          <span className='pl-1'>Upcoming</span>
        </ToggleButton>
      )}
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: 'default' | 'sm';
  compact?: boolean;
  isSmall: boolean;
}

function ToggleButton({ active, onClick, children, compact = false, isSmall }: ToggleButtonProps) {

  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-full flex items-center justify-center
        transition-all duration-300
        ${isSmall ? 'px-3 py-1.5' : 'px-4 py-2'} // Padding can still use isSmall
        ${compact ? 'sm:px-3 px-2 py-1' : ''} // Compact padding overrides
        ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
      `}
    >
      {active && (
        <motion.div
          layoutId={`toggle-bg-${compact ? 'compact' : 'default'}`}
          className="absolute inset-0 bg-white dark:bg-gray-5-dark rounded-full shadow-sm"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative flex items-center">{children}</span>
    </button>
  );
}
