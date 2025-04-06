// components/WithProfileCompleted.tsx (No Change Needed, but explanation below)
'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc,  onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Loading from '@/components/Loading';

export function WithProfileCompleted<T extends object>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    const { user } = useAuthContext();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileComplete, setIsProfileComplete] = useState(false);

    useEffect(() => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        const userData = doc.data();
        if (!userData?.setupCompleted) {
          router.push('/welcome');
        } else {
          setIsProfileComplete(true);
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    }, [user, router]);

    // Render the basic layout structure even during loading,
    // placing the Loading component inside the main scrollable area.
    // This requires importing the necessary layout components.
    // Note: This assumes a simplified structure. If RootLayout has complex dependencies
    // or context providers needed *before* the loading check, this might need adjustment.
    // However, based on RootLayout's structure, this should work.

    // We can't directly import RootLayout here due to circular dependencies/HOC structure.
    // Instead, we replicate the minimal structure needed to place Loading correctly.
    // A better long-term solution might involve restructuring state management
    // so loading happens *within* RootLayout's children area.

    if (isLoading) {
      // Replicate minimal structure from RootLayout to place Loading inside main
      return (
        <div className="flex flex-col h-screen">
          {/* We might not need Navigation during this initial profile check */}
          {/* <Navigation /> */}
          <main className="flex-grow overflow-y-auto">
             <div className="mt-[var(--navbar-height)]"> {/* Keep consistent spacing */}
               <Loading message="Checking profile..." spinnerType="full" />
             </div>
          </main>
        </div>
      );
    }


    if (!isProfileComplete) {
      return null; // Or a redirect component if you prefer
    }

    return <Component {...props} />;
  };
}
