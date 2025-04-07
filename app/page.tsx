import React from 'react';
import LandingHeader from '@/components/LandingHeader';

export default function LandingPage() {
  return (
    <> 
      <LandingHeader /> 
      <div className="flex flex-col items-center justify-center min-h-screen pt-16">
        <h1 className="text-4xl font-bold mb-4">Welcome to Nothing<sup>2C</sup></h1>
        <p className="text-lg text-muted-foreground">Your new landing page content goes here.</p>
      </div>
    </>
  );
}
