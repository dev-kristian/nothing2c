// context/ScreenSizeContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';

type ScreenSize = {
  isMobile: boolean;      // < 640px
  isTablet: boolean;      // 640px - 1024px
  isDesktop: boolean;     // 1024px - 1920px
  is4K: boolean;          // >= 1920px
  currentWidth: number;
};

const ScreenSizeContext = createContext<ScreenSize>({
  isMobile: false,
  isTablet: false,
  isDesktop: false,
  is4K: false,
  currentWidth: 0,
});

export const ScreenSizeProvider = ({ children }: { children: React.ReactNode }) => {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    is4K: false,
    currentWidth: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setScreenSize({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024 && width < 1920,
        is4K: width >= 1920,
        currentWidth: width,
      });
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      {children}
    </ScreenSizeContext.Provider>
  );
};

export const useScreenSize = () => useContext(ScreenSizeContext);
