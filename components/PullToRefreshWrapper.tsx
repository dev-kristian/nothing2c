'use client';

import React, { useState, useEffect, useRef } from 'react'; // Removed TouchEvent import

const PullToRefreshWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Removed unused isRefreshing state
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  // Use matchMedia for more reliable PWA standalone detection
  const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
  // Removed unused isIOS variable definition

  useEffect(() => {
    // Apply only if in standalone mode
    if (!isStandalone) return; 

    // Attach listeners to document instead of containerRef
    const targetElement = document; 
    let isDragging = false;

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      // Reinstate scroll check, using documentElement.scrollTop
      if (document.documentElement.scrollTop === 0) { 
        setStartY(e.touches[0].clientY);
        isDragging = true;
        setPullDistance(0); // Reset pull distance on new touch
      } else {
        isDragging = false;
      }
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!isDragging) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY); // Only track downward pull
      setPullDistance(distance);

      // Add visual feedback if needed (e.g., showing an indicator)
      // For simplicity, we'll just track the distance for now.
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      isDragging = false;

      // Threshold to trigger refresh (e.g., 100 pixels)
      if (pullDistance > 100) {
        // Removed setIsRefreshing(true)
        // Add a small delay for visual feedback before reloading
        setTimeout(() => {
          window.location.reload();
        }, 300); // Adjust delay as needed
      } else {
        // Reset if pull wasn't far enough
        setPullDistance(0);
      }
    };

    // Add listeners to the document
    targetElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    targetElement.addEventListener('touchmove', handleTouchMove, { passive: true });
    targetElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    targetElement.addEventListener('touchcancel', handleTouchEnd, { passive: true }); // Handle cancellation

    return () => {
      // Remove listeners from the document
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      targetElement.removeEventListener('touchend', handleTouchEnd);
      targetElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isStandalone, startY, pullDistance]); // Dependency remains the same

  // Optional: Add a visual indicator for refreshing
  // const refreshIndicatorStyle: React.CSSProperties = {
  //   position: 'fixed',
  //   top: 'calc(var(--navbar-height) + 10px)', // Position below navbar
  //   left: '50%',
  //   transform: 'translateX(-50%)',
  //   zIndex: 1000,
  //   padding: '5px 10px',
  //   background: 'rgba(0,0,0,0.7)',
  //   color: 'white',
  //   borderRadius: '5px',
  //   display: isRefreshing ? 'block' : 'none',
  // };

  return (
    <div ref={containerRef} style={{ minHeight: '100%' }}>
      {/* <div style={refreshIndicatorStyle}>Refreshing...</div> */}
      {/* You could add a more sophisticated indicator based on pullDistance */}
      {children}
    </div>
  );
};

export default PullToRefreshWrapper;
