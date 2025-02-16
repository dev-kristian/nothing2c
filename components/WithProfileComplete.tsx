// components/WithProfileCompleted.tsx
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

    if (isLoading) {
      return <Loading message="Checking profile..." spinnerType="full" />;
    }

    if (!isProfileComplete) {
      return null;
    }

    return <Component {...props} />;
  };
}
