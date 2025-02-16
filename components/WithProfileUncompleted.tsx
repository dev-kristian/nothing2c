// components/WithProfileUncompleted.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Loading from '@/components/Loading';

export function WithProfileUncompleted<T extends object>(Component: React.ComponentType<T>) {
  return function WrappedComponent(props: T) {
    const { user } = useAuthContext();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

    useEffect(() => {
      async function checkProfile() {
        if (!user) {
          setIsLoading(false);
          return;
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();

          if (userData?.setupCompleted) {
            router.push('/');
          } else {
            setIsProfileIncomplete(true);
          }
        } catch (error) {
          console.error('Error checking profile:', error);
        } finally {
          setIsLoading(false);
        }
      }

      checkProfile();
    }, [user, router]);

    if (isLoading) {
      return <Loading message="Checking profile..." spinnerType="full" />;
    }

    if (!isProfileIncomplete) {
      return null;
    }

    return <Component {...props} />;
  };
}
