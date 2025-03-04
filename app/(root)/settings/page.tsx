// app/(root)/settings/page.tsx
"use client"

import React, { useState } from 'react';
import { Bell, User, Shield, Palette, ChevronRight } from 'lucide-react';
import AnimatedTitle from '@/components/AnimatedTitle';
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
    <div className="container-6xl mx-auto px-2 md:px-4 ">
      <div className="mb-6">
        <AnimatedTitle>
          {(className) => (
            <span className={className}>Settings</span>
          )}
        </AnimatedTitle>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          {settingsCategories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                activeCategory === id
                  ? 'bg-accent/10 text-accent'
                  : 'hover:bg-accent/5 text-foreground/90'
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

        {/* Settings Content */}
        <div className="flex-1 min-h-[500px] bg-background/50 rounded-lg border border-accent/10 p-6">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
