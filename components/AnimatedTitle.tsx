'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTitleProps {
  children: (className: string) => React.ReactNode;
}

const AnimatedTitle: React.FC<AnimatedTitleProps> = ({ children }) => {
  return (
    <motion.h1
      className="text-4xl font-bold mb-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children("text-white")}
    </motion.h1>
  );
};

export default AnimatedTitle;