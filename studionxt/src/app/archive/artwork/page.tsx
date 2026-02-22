'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

function ArtworkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const userId = auth.currentUser?.uid || 'demo-user';
        const snap = await getDoc(doc(db, 'artists', userId, 'artworks', id));
        if (snap.exists()) {
          setArtwork({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-purple-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Artwork not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => router.back()}
          className="text-gray-500 text-sm mb-8 hover:text-white transition-all"
        >
          Back to Archive
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {artwork.imageUrl && (
              <div className="rounded-xl overflow-hidden">
                <img
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  className="w-full object-cover"
                />
              </div>
            )}
            {artwork.originalUrl && (
              
                href={artwork.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-[#333] text-gray-400 text-sm rounded-lg hover:border-purple-600 hover:text-purple-400 transition-all"
              >
                Download full resolution
              </a>
            )}
          </div>
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">
              Artwork
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {artwork.title || 'Untitled'}
            </h1>
            <div className="text-gray-500 text-sm mb-6">
              {artwork.year}{artwork.medium ? ` · ${artwork.medium}` : ''}
            </div>
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden mb-6">
              <div className="flex justify-between px-4 py-3 border-b border-[#1a1a1a]">
                <span className="text-xs text-gray-500">Medium</span>
                <span className="text-xs text-white">{artwork.medium}</span>
              </div>
              <div className="flex justify-between px-4 py-3 border-b border-[#1a1a1a]">
                <span className="text-xs text-gray-500">Year</span>
                <span className="text-xs text-white">{artwork.year}</span>
              </div>
              <div className="flex justify-between px-4 py-3 border-b border-[#1a1a1a]">
                <span className="text-xs text-gray-500">Dimensions</span>
                <span className="text-xs text-white">{artwork.dimensions || '—'}</span>
              </div>
              <div className="flex justify-between px-4 py-3 border-b border-[#1a1a1a]">
                <span className="text-xs text-gray-500">Status</span>
                <span className="text-xs text-purple-400">{artwork.status}</span>
              </div>
              <div className="flex justify-between px-4 py-3">
                <span className="text-xs text-gray-500">Price</span>
                <span className="text-xs text-white">{artwork.price || '—'}</span>
              </div>
            </div>
            <div className="bg-[#111] border border-[#1a1a2e] rounded-xl p-4">
              <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">
                Mira
              </div>
              <div className="text-gray-400 text-xs leading-relaxed">
                {artwork.title || 'This work'} is recorded in your archive.
                {artwork.medium ? ` ${artwork.medium}.` : ''}
                {artwork.status ? ` Status: ${artwork.status}.` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArtworkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-purple-400 text-sm">Loading...</div>
      </div>
    }>
      <ArtworkContent />
    </Suspense>
  );
}
