'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ArtworkPage() {
  const router = useRouter();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { setLoading(false); return; }
    const userId = auth.currentUser?.uid || 'demo-user';
    getDoc(doc(db, 'artists', userId, 'artworks', id))
      .then(snap => { if (snap.exists()) setArtwork({ id: snap.id, ...snap.data() }); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="text-purple-400 text-sm">Loading...</div></div>;
  if (!artwork) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="text-gray-500 text-sm">Not found.</div></div>;

  return <div className="min-h-screen bg-[#0A0A0A] text-white p-10">
    <button onClick={() => router.back()} className="text-gray-500 text-sm mb-8 hover:text-white block">Back to Archive</button>
    <h1 className="text-2xl font-bold text-white mb-2">{artwork.title || 'Untitled'}</h1>
    <div className="text-gray-500 text-sm mb-6">{artwork.year} · {artwork.medium}</div>
    {artwork.imageUrl && <img src={artwork.imageUrl} alt={artwork.title} className="w-full max-w-lg rounded-xl mb-6" />}
    {artwork.originalUrl && <a href={artwork.originalUrl} target="_blank" rel="noopener noreferrer" className="block mb-6 text-purple-400 text-sm">Download full resolution</a>}
    <div className="bg-[#111] border border-[#222] rounded-xl p-4 max-w-lg">
      {[['Medium', artwork.medium], ['Year', artwork.year], ['Dimensions', artwork.dimensions], ['Status', artwork.status], ['Price', artwork.price]].map(([l, v]) => (
        <div key={l} className="flex justify-between py-2 border-b border-[#1a1a1a]">
          <span className="text-xs text-gray-500">{l}</span>
          <span className="text-xs text-white">{v || '—'}</span>
        </div>
      ))}
    </div>
  </div>;
}
