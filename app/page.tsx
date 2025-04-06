import React from 'react';
import LandingHeader from '@/components/LandingHeader'; // Import the header

export default function LandingPage() {
  return (
    <> {/* Use a fragment to wrap header and content */}
      <LandingHeader /> {/* Add the header */}
      <div className="flex flex-col items-center justify-center min-h-screen pt-16">
        <h1 className="text-4xl font-bold mb-4">Welcome to Nothing<sup>2C</sup></h1>
        <p className="text-lg text-muted-foreground">Your new landing page content goes here.</p>
        {/* Add more landing page components/content as needed */}
      </div>
    </>
  );
}
