'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/studio');
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

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
