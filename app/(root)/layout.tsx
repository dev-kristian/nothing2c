
import React, { Suspense } from 'react';
import SpinningLoader from '@/components/SpinningLoader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <>
      <main className="flex-grow">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
              <SpinningLoader />
            </div>
          }>
            <div>
              {children}
            </div>
          </Suspense>
        </main>
    </>
  );
}
