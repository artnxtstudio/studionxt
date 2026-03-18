'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        setChecking(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D0B09',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: '20px',
          color: '#504840',
        }}>
          StudioNXT
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
