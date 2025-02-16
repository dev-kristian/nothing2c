// components/home/CreateSession.tsx
'use client'

import { Button } from '@/components/ui/button';
import { FiCalendar } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function CreateSession() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Create Watch Party</h2>
        <p className="text-sm text-gray-400">Plan your next movie night with friends</p>
      </div>
      
      <Button
        onClick={() => router.push('/sessions?new=true')}
        className="group relative px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-full"
      >
        <motion.span 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiCalendar className="w-4 h-4" />
          <span>New Session</span>
        </motion.span>
      </Button>
    </div>
  );
}
