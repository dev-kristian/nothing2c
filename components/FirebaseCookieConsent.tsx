// components/FirebaseCookieConsent.tsx
'use client'

import { useState, useEffect } from 'react'

export function FirebaseCookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('firebase-cookie-consent')
    if (!consent) {
      setShowConsent(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('firebase-cookie-consent', 'true')
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <p className="text-sm">
          This site uses Firebase services for authentication and data storage. 
          By continuing to use this site, you agree to our use of necessary cookies and data storage.
        </p>
        <button
          onClick={acceptCookies}
          className="ml-4 px-4 py-2 bg-white text-gray-900 rounded-md"
        >
          Accept
        </button>
      </div>
    </div>
  )
}
