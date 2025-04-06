// components/settings/AppearanceSettings.tsx
'use client'

import { useTheme } from '@/context/ThemeContext'
import { useState, useEffect } from 'react'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure we're mounted before showing theme options to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const themeOptions = [
    {
      id: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Light mode for bright environments',
      preview: 'bg-white border border-gray-200',
      textColor: 'text-black'
    },
    {
      id: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Dark mode for low-light environments',
      preview: 'bg-gray-900 border border-gray-700',
      textColor: 'text-white'
    },
    {
      id: 'system',
      label: 'System',
      icon: Laptop,
      description: 'Follow your system preferences',
      preview: 'bg-gradient-to-r from-white to-gray-900 border border-gray-300',
      textColor: 'text-gray-800'
    }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Appearance</h2>
        <p className="text-muted-foreground">
          Customize how Nothing<sup>2C</sup> looks on your device
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Theme</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const isActive = theme === option.id
              
              return (
                <div 
                  key={option.id}
                  className={`
                    relative overflow-hidden rounded-xl transition-all
                    ${isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'hover:ring-1 hover:ring-accent/50'}
                  `}
                  onClick={() => setTheme(option.id as 'light' | 'dark' | 'system')}
                >
                  {/* Preview area */}
                  <div className={`h-32 ${option.preview} relative`}>
                    {/* Sample UI elements to show theme preview */}
                    <div className="absolute inset-0 flex flex-col p-4">
                      <div className={`w-24 h-3 rounded-full mb-2 ${option.id === 'dark' ? 'bg-gray-700' : option.id === 'light' ? 'bg-gray-200' : 'bg-gradient-to-r from-gray-200 to-gray-700'}`}></div>
                      <div className={`w-16 h-3 rounded-full mb-3 ${option.id === 'dark' ? 'bg-gray-700' : option.id === 'light' ? 'bg-gray-200' : 'bg-gradient-to-r from-gray-200 to-gray-700'}`}></div>
                      <div className={`flex space-x-1 mb-2`}>
                        <div className={`w-8 h-8 rounded-lg ${option.id === 'dark' ? 'bg-gray-800' : option.id === 'light' ? 'bg-gray-100' : 'bg-gradient-to-r from-gray-100 to-gray-800'}`}></div>
                        <div className={`w-8 h-8 rounded-lg ${option.id === 'dark' ? 'bg-gray-800' : option.id === 'light' ? 'bg-gray-100' : 'bg-gradient-to-r from-gray-100 to-gray-800'}`}></div>
                      </div>
                      <div className={`w-full h-3 rounded-full ${option.id === 'dark' ? 'bg-gray-800' : option.id === 'light' ? 'bg-gray-100' : 'bg-gradient-to-r from-gray-100 to-gray-800'}`}></div>
                    </div>
                    
                    {/* Selected indicator */}
                    {isActive && (
                      <div className="absolute top-2 right-2 bg-accent rounded-full p-1">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Label area */}
                  <div className="p-4 bg-background">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-accent' : ''}`} />
                      <h4 className="font-medium">{option.label}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                  </div>
                  
                  {/* Interactive overlay */}
                  <motion.div 
                    className="absolute inset-0 bg-accent/5 opacity-0 cursor-pointer"
                    whileHover={{ opacity: 1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )
            })}
          </div>
        </div>
        
      </div>
    </div>
  )
}
