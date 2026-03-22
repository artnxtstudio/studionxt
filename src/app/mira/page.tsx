'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import MiraChat from '@/components/mira/MiraChat';

export default function MiraPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      try {
        const profileSnap = await getDoc(doc(db, 'artists', user.uid));
        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        // Fall back to Firebase Auth displayName if Firestore name is missing
        if (!profileData.name && user.displayName) {
          profileData.name = user.displayName;
        }
        setProfile(profileData);
        const worksSnap = await getDocs(collection(db, 'artists', user.uid, 'artworks'));
        setArtworks(worksSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-purple-700 animate-pulse flex items-center justify-center text-white font-bold text-sm">M</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-muted hover:text-secondary transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-white text-xs font-bold">M</div>
            <span className="text-sm font-medium text-primary">Mira</span>
            <span className="text-xs text-muted">· Studio Assistant</span>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <MiraChat
            artistName={profile?.name || 'there'}
            practiceType={profile?.practiceType || ''}
            mediums={profile?.mediums || []}
            country={profile?.country || ''}
            careerLength={profile?.careerLength || ''}
            artworks={artworks}
          />
        </div>
      </div>
    </div>
  );
}
