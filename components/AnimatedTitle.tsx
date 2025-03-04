// components/AnimatedTitle.tsx
'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTitleProps {
  children: (className: string) => React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const AnimatedTitle: React.FC<AnimatedTitleProps> = ({ 
  children, 
  size = 'lg' 
}) => {
  // Apple-inspired text sizes with proper scaling
  const sizeClasses = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl lg:text-6xl",
    xl: "text-5xl md:text-6xl lg:text-7xl"
  };
  
  // Word animation for staggered entrance
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.04,
      }
    }
  };
  
  // Letter animation for subtle float-in effect
  const child = {
    hidden: { 
      y: 20, 
      opacity: 0,
      filter: "blur(5px)"
    },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { 
        type: "spring",
        damping: 12,
        stiffness: 100,
        duration: 0.5
      }
    }
  };

  return (
    <motion.h1
      className={`font-semibold tracking-tight mb-8 ${sizeClasses[size]}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.span 
        className="inline-block"
        variants={child}
      >
        {children("text-foreground font-medium leading-tight")}
      </motion.span>
    </motion.h1>
  );
};

export default AnimatedTitle;
