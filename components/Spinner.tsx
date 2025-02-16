'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import searchingAnimation from '@/public/icons/searching.json';

// Dynamically import Lottie with ssr set to false
const LottiePlayer = dynamic(() => import('lottie-react'), { 
  ssr: true 
});

interface LoaderProps {
  size?: number;
  className?: string;
}

const Spinner: React.FC<LoaderProps> = ({ 
  size = 200, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <LottiePlayer
        animationData={searchingAnimation}
        loop
        autoplay
        style={{ 
          width: size, 
          height: size 
        }}
      />
    </div>
  );
};

export default Spinner;
