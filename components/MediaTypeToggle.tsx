// components/MediaTypeToggle.tsx
'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { Film, Tv } from 'lucide-react';

interface MediaTypeToggleProps {
  mediaType: 'movie' | 'tv';
  onMediaTypeChange: (type: 'movie' | 'tv') => void;
  size?: 'default' | 'sm';
  compact?: boolean; // Added compact prop
}

export default function MediaTypeToggle({ 
  mediaType, 
  onMediaTypeChange,
  size = 'default',
  compact = false // Default to false
}: MediaTypeToggleProps) {
  const isSmall = size === 'sm' || compact; // Use either size='sm' or compact=true
  
  return (
    <div 
      className={`
        frosted-panel p-1 rounded-full flex items-center
        ${isSmall ? 'text-xs' : 'text-sm'}
        ${compact ? 'min-w-0' : ''}
      `}
    >
      <ToggleButton 
        active={mediaType === 'movie'}
        onClick={() => onMediaTypeChange('movie')}
        size={size}
        compact={compact}
      >
        <Film className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} ${compact ? 'mr-1' : 'mr-1.5'}`} />
        <span className={compact ? 'hidden sm:inline' : ''}>Movies</span>
        {compact && <span className="sm:hidden">M</span>}
      </ToggleButton>
      
      <ToggleButton 
        active={mediaType === 'tv'}
        onClick={() => onMediaTypeChange('tv')}
        size={size}
        compact={compact}
      >
        <Tv className={`${isSmall ? 'h-3 w-3' : 'h-4 w-4'} ${compact ? 'mr-1' : 'mr-1.5'}`} />
        <span className={compact ? 'hidden sm:inline' : ''}>TV Shows</span>
        {compact && <span className="sm:hidden">TV</span>}
      </ToggleButton>
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: 'default' | 'sm';
  compact?: boolean;
}

function ToggleButton({ active, onClick, children, size = 'default', compact = false }: ToggleButtonProps) {
  const isSmall = size === 'sm' || compact;
  
  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-full flex items-center justify-center
        transition-all duration-300
        ${isSmall ? 'px-3 py-1.5' : 'px-4 py-2'} 
        ${compact ? 'sm:px-3 px-2 py-1' : ''}
        ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}
      `}
    >
      {active && (
        <motion.div
          layoutId={`toggle-bg-${compact ? 'compact' : size}`}
          className="absolute inset-0 bg-white dark:bg-gray-5-dark rounded-full shadow-sm"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative flex items-center">{children}</span>
    </button>
  );
}
