'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const userId = auth.currentUser?.uid || 'demo-user';
        const docRef = doc(db, 'artists', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as ArtistProfile);
        }
        const artworksSnap = await getDocs(
          collection(db, 'artists', userId, 'artworks')
        );
        setArtworkCount(artworksSnap.size);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-purple-400 text-sm">Loading your studio...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">StudioNXT</div>
            <h1 className="text-2xl font-bold text-white">Your Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              {profile?.practiceType} · {profile?.country}
            </div>
            <button
              onClick={() => router.push('/upload')}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all"
            >+ Add Artwork</button>
          </div>
        </div>

        <div className="bg-[#111] border border-[#1a1a2e] rounded-2xl p-6 mb-6">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-3">Mira</div>
          <p className="text-gray-300 text-sm leading-relaxed">
            {artworkCount === 0
              ? "Your archive is empty. Upload your first artwork and I will begin building your studio records."
              : `Your archive contains ${artworkCount} ${artworkCount === 1 ? 'work' : 'works'}. Ask me anything about your practice.`
            }
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Works Archived', value: artworkCount.toString() },
            { label: 'Available', value: '0' },
            { label: 'Documents', value: '0' },
            { label: 'Sold', value: '0' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#111] border border-[#222] rounded-xl p-5">
              <div className="text-xs text-gray-500 mb-2">{stat.label}</div>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {artworkCount === 0 && (
          <div
            onClick={() => router.push('/upload')}
            className="bg-[#111] border border-[#222] rounded-2xl p-6 flex flex-col items-center justify-center text-center py-16 cursor-pointer hover:border-purple-700 transition-all"
          >
            <div className="text-4xl mb-4">⬆</div>
            <h2 className="text-lg font-semibold text-white mb-2">Upload your first artwork</h2>
            <p className="text-sm text-gray-500 mb-6">One image to start. Mira will guide you through the details.</p>
            <button className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all">
              Add First Artwork
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
