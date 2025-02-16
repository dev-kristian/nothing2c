"use client"

import React from 'react';
import dynamic from 'next/dynamic';

// Import JSON files using ES6 imports
import defaultSpinner from '@/public/icons/loading.json';
import minimalSpinner from '@/public/icons/loading.json';
import fullSpinner from '@/public/icons/loading.json';

// Dynamically import Lottie with ssr set to false
const LottiePlayer = dynamic(() => import('lottie-react'), { 
  ssr: false 
});

interface LoadingProps {
  size?: number;
  className?: string;
  message?: string;
  spinnerType?: 'default' | 'minimal' | 'full';
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 200, 
  className = '', 
  message = 'Loading...', 
  spinnerType = 'default' 
}) => {
  const getSpinnerAnimation = () => {
    switch(spinnerType) {
      case 'minimal':
        return minimalSpinner;
      case 'full':
        return fullSpinner;
      default:
        return defaultSpinner;
    }
  };

  return (
    <div 
      className={`
        flex flex-col items-center justify-center 
        w-full h-full 
        ${spinnerType === 'full' ? 'fixed inset-0 bg-background/70 z-50' : ''}
        ${className}
      `}
    >
      <div className="flex flex-col items-center justify-center">
        <LottiePlayer
          animationData={getSpinnerAnimation()}
          loop
          autoplay
          style={{ 
            width: size, 
            height: size 
          }}
        />
        {message && (
          <p className="mt-4 text-muted-foreground text-sm">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loading;
