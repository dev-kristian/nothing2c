'use client'

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react'; 

interface NavItem {
  href: string;
  icon: LucideIcon; 
  label: string;
}

interface DesktopNavLinksProps {
  navigationItems: NavItem[];
  isActivePath: (path: string) => boolean;
}

export default function DesktopNavLinks({ navigationItems, isActivePath }: DesktopNavLinksProps) {
  return (
    <>
      {navigationItems.map(({ href, icon: Icon, label }) => (
        <motion.div
          key={href}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href={href}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300
              ${isActivePath(href)
                ? 'bg-pink text-white'
                : 'hover:bg-foreground/5 dark:hover:bg-foreground/10'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActivePath(href) ? 'text-white' : ''}`} />
            <span className="font-medium">{label}</span>
          </Link>
        </motion.div>
      ))}
    </>
  );
}
