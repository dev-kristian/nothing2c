// app/(root)/settings/page.tsx
"use client"

import React, { useState } from 'react';
import { Bell, User, Shield, Palette, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {NotificationSettings, AccountSettings, PrivacySettings, AppearanceSettings} from '@/components/settings'

const settingsCategories = [
  {
    id: 'account',
    label: 'Account',
    icon: User,
    component: AccountSettings,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    component: NotificationSettings,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    icon: Shield,
    component: PrivacySettings,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    component: AppearanceSettings,
  },
];

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState(settingsCategories[0].id);

  const ActiveComponent = settingsCategories.find(
    category => category.id === activeCategory
  )?.component || settingsCategories[0].component;

  return (
    <div className="container-6xl mx-auto px-2 md:px-4 py-4 md:py-8"> 
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center w-full mb-3 sm:mb-4 md:mb-6"
      >
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-foreground/70 text-xs sm:text-sm font-medium mb-1"
        >
          Manage your account and preferences
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1,
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="font-semibold tracking-tight text-lg sm:text-xl md:text-2xl lg:text-4xl mb-3 sm:mb-4 md:mb-6"
        >
          <span className="text-gray-5-dark dark:text-gray-5">Manage Your </span> 
          <span className="text-pink dark:text-pink-dark font-semibold">Settings</span>
        </motion.div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 space-y-1">
          {settingsCategories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                activeCategory === id
                  ? 'bg-pink text-white'
                  : 'hover:bg-accent/5 text-foreground' 
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                activeCategory === id ? 'rotate-90' : ''
              }`} />
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-[500px] bg-background/50 rounded-lg border border-accent/10 p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
