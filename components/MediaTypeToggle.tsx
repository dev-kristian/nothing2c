// components/MediaTypeToggle.tsx
'use client'

import React from 'react';
import { motion } from 'framer-motion';

type MediaType = 'movie' | 'tv';

interface MediaTypeToggleProps {
  mediaType: MediaType;
  onMediaTypeChange: (type: MediaType) => void;
}

const MediaTypeToggle: React.FC<MediaTypeToggleProps> = ({ mediaType, onMediaTypeChange }) => {
  return (
    <div className="frosted-glass rounded-full p-0.5 inline-flex">
      <div className="relative z-0 flex">
        <motion.div 
          className="absolute inset-0 z-0 bg-primary/20 dark:bg-primary/30 rounded-full shadow-sm"
          initial={false}
          animate={{
            x: mediaType === 'movie' ? 0 : '100%',
            width: '50%'
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
        <button
          onClick={() => onMediaTypeChange('movie')}
          className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            mediaType === 'movie'
              ? 'text-primary dark:text-primary-foreground'
              : 'text-foreground/60 dark:text-foreground/60 hover:text-foreground dark:hover:text-foreground'
          }`}
        >
          Movies
        </button>
        <button
          onClick={() => onMediaTypeChange('tv')}
          className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            mediaType === 'tv'
              ? 'text-primary dark:text-primary-foreground'
              : 'text-foreground/60 dark:text-foreground/60 hover:text-foreground dark:hover:text-foreground'
          }`}
        >
          TV Shows
        </button>
      </div>
    </div>
  );
};

export default MediaTypeToggle;
