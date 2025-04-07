'use client'
import React from 'react';
import { motion } from 'framer-motion';

const ClearSequentialSpinner = ({ size = 150 }) => {
  const pinkColor = "#FF2D55";
  const numCircles = 7;

  // Generate circles with decreasing sizes
  const circles = Array.from({ length: numCircles }).map((_, i) => ({
    id: i,
    size: Math.max(size * (0.18 - (i * 0.018)), 8), // Ensure minimum visible size
    opacity: 1 - (i * 0.08), // Decreasing opacity
  }));

  // Variants for the container to manage staggering
  const containerVariants = {
    hidden: {}, // Initial state (can be empty)
    visible: {
      transition: {
        staggerChildren: 0.2 // Delay between each circle starting animation
      }
    }
  };

  // Variants for individual circles animation
  const circleVariants = {
    hidden: { rotate: 0 },
    visible: {
      rotate: 360,
      transition: {
        duration: 1.8,
        ease: [0.2, 0, 0.8, 1], // Slow start, fast middle, slow end
        repeat: Infinity,       // Repeat the animation indefinitely
        repeatDelay: 1.2        // Delay between repetitions (approx 3s total loop feel)
      }
    }
  };

  return (
    // Container div to orchestrate the staggering
    <motion.div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      variants={containerVariants}
      initial="hidden" // Start in the hidden state
      animate="visible" // Animate to the visible state on mount
    >
      {circles.map(circle => (
        // Individual animated circles
        <motion.div
          key={circle.id}
          variants={circleVariants} // Apply circle animation variants
          // initial/animate props are inherited from the parent container
          style={{
            position: 'absolute',
            width: circle.size,
            height: circle.size,
            borderRadius: '50%',
            backgroundColor: pinkColor,
            opacity: circle.opacity,
            top: 0, // Start at top
            left: '50%',
            marginLeft: -(circle.size / 2),
            transformOrigin: `50% ${size/2}px`, // Rotate around center of container
          }}
        />
      ))}
    </motion.div>
  );
};

export default ClearSequentialSpinner;
