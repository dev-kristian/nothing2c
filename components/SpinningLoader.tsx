'use client'
import React from 'react';
import { motion } from 'framer-motion';

const ClearSequentialSpinner = ({ size = 150 }) => {
  const pinkColor = "#FF2D55";
  const numCircles = 7;

  const circles = Array.from({ length: numCircles }).map((_, i) => ({
    id: i,
    size: Math.max(size * (0.18 - (i * 0.018)), 8), 
    opacity: 1 - (i * 0.08),
  }));

  const containerVariants = {
    hidden: {}, 
    visible: {
      transition: {
        staggerChildren: 0.2 
      }
    }
  };

  const circleVariants = {
    hidden: { rotate: 0 },
    visible: {
      rotate: 360,
      transition: {
        duration: 1.8,
        ease: [0.2, 0, 0.8, 1],
        repeat: Infinity,
        repeatDelay: 1.2 
      }
    }
  };

  return (
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
      initial="hidden"
      animate="visible"
    >
      {circles.map(circle => (
        <motion.div
          key={circle.id}
          variants={circleVariants}
          style={{
            position: 'absolute',
            width: circle.size,
            height: circle.size,
            borderRadius: '50%',
            backgroundColor: pinkColor,
            opacity: circle.opacity,
            top: 0,
            left: '50%',
            marginLeft: -(circle.size / 2),
            transformOrigin: `50% ${size/2}px`, 
          }}
        />
      ))}
    </motion.div>
  );
};

export default ClearSequentialSpinner;
