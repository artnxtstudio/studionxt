'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import MiraChat from '@/components/mira/MiraChat';

interface ArtistProfile {
  practiceType: string;
  mediums: string[];
  country: string;
  careerLength: string;
  primaryIntent: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [artworkCount, setArtworkCount] = useState(0);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Firebase auth to resolve before fetching anything
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const userId = user?.uid || '';
        const docRef = doc(db, 'artists', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as ArtistProfile);
        }
        const artworksSnap = await getDocs(
          collection(db, 'artists', userId, 'artworks')
        );
        const works = artworksSnap.docs.map(d => d.data());
        setArtworks(works);
        setArtworkCount(artworksSnap.size);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-primary">
        <div className="max-w-5xl mx-auto px-6 py-10 animate-pulse">
          <div className="flex justify-between items-center mb-10">
            <div className="space-y-2">
              <div className="h-3 bg-card-hover rounded w-20"></div>
              <div className="h-6 bg-card-hover rounded w-32"></div>
            </div>
            <div className="h-8 bg-card-hover rounded w-28"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="bg-card border border-default rounded-xl p-5 space-y-3">
                    <div className="h-3 bg-card-hover rounded w-1/2"></div>
                    <div className="h-8 bg-card-hover rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-[560px] bg-card border border-default rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">StudioNXT</div>
            <h1 className="text-2xl font-bold text-primary">Your Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-secondary">
              {profile?.practiceType} · {profile?.country}
            </div>
            <button
              onClick={() => router.push('/upload')}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-primary text-sm rounded-lg transition-all"
            >+ Add Artwork</button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Works Archived', value: artworkCount.toString() },
                { label: 'Available', value: artworks.filter(w => w.status === 'Available').length.toString() },
                { label: 'Documents', value: '0' },
                { label: 'Sold', value: artworks.filter(w => w.status === 'Sold').length.toString() },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-default rounded-xl p-5">
                  <div className="text-xs text-secondary mb-2">{stat.label}</div>
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Upload CTA */}
            {artworkCount === 0 && (
              <div
                onClick={() => router.push('/upload')}
                className="bg-card border border-default rounded-2xl flex flex-col items-center justify-center text-center py-16 cursor-pointer hover:border-purple-700 transition-all"
              >
                <div className="text-4xl mb-4">⬆</div>
                <h2 className="text-lg font-semibold text-primary mb-2">Upload your first artwork</h2>
                <p className="text-sm text-secondary mb-6">One image to start. Mira will guide you through the details.</p>
                <button className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-primary text-sm rounded-lg transition-all">
                  Add First Artwork
                </button>
              </div>
            )}

          </div>

          {/* Mira */}
          <div className="h-[560px]">
            <MiraChat artworkCount={artworkCount} />
          </div>

        </div>
      </div>
    </div>
  );
}
