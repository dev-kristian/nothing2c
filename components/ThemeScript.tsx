// components/ThemeScript.tsx
'use client'

import { useTheme } from '@/context/ThemeContext'
import { useEffect } from 'react'

export function ThemeScript() {
  const { setTheme } = useTheme()
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [setTheme])
  
  return null
}
