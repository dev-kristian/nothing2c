'use client';

import React, { useState, useEffect, useRef } from 'react'; // Removed TouchEvent import

const PullToRefreshWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Removed unused isRefreshing state
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isStandaloneIOS = typeof window !== 'undefined' && ('standalone' in window.navigator) && window.navigator.standalone === true && /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    if (!isStandaloneIOS || !containerRef.current) return;

    const container = containerRef.current;
    let isDragging = false;

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      // Only start tracking if scrolled to the top
      if (window.scrollY === 0) {
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

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true }); // Handle cancellation

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isStandaloneIOS, startY, pullDistance]); // Include dependencies

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
