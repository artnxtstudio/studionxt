'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ArtworkEdit from '@/components/ArtworkEdit';

export default function ArtworkPage() {
  const router = useRouter();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enlarged, setEnlarged] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [userId, setUserId] = useState('demo-user');
  const [artworkId, setArtworkId] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id') || '';
    setArtworkId(id);
    if (!id) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const uid = user?.uid || 'demo-user';
        setUserId(uid);
        const snap = await getDoc(doc(db, 'artists', uid, 'artworks', id));
        if (snap.exists()) setArtwork({ id: snap.id, ...snap.data() });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'artists', userId, 'artworks', artworkId));
      router.push('/archive');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-6 animate-pulse">
          <div className="h-64 bg-[#111] rounded-2xl"></div>
          <div className="h-4 bg-[#111] rounded w-1/2"></div>
          <div className="h-3 bg-[#111] rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-4">Artwork not found.</div>
          <button onClick={() => router.push('/archive')} className="text-purple-400 text-sm">Back to Archive</button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <ArtworkEdit
        artwork={artwork}
        userId={userId}
        artworkId={artworkId}
        onDone={(updated) => { setArtwork(updated); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const fields = [
    ['Medium', artwork.medium],
    ['Year', artwork.year],
    ['Dimensions', artwork.dimensions],
    ['Weight', artwork.weight ? artwork.weight + ' lbs' : null],
    ['Status', artwork.status],
    ['Price', artwork.price],
    ['Location', artwork.locationCurrent],
    ['Condition', artwork.condition],
    ['Series', artwork.seriesName],
  ].filter((pair) => pair[1]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-white transition-colors">
            Back to Archive
          </button>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="px-4 py-2 border border-[#333] hover:border-purple-700 text-gray-400 hover:text-white text-xs rounded-lg transition-all">
              Edit
            </button>
            <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 border border-[#333] hover:border-red-700 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all">
              Delete
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
          <div>
            {artwork.imageUrl ? (
              <div>
                <img src={artwork.imageUrl} alt={artwork.title} onClick={() => setEnlarged(true)} className="w-full rounded-2xl border border-[#222] hover:border-purple-700 transition-all cursor-zoom-in" />
                <p className="text-xs text-gray-600 mt-2 text-center">Tap to enlarge</p>
              </div>
            ) : (
              <div className="w-full h-64 bg-[#111] border border-[#222] rounded-2xl flex items-center justify-center text-4xl">🖼</div>
            )}
          </div>
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">{artwork.year}</div>
            <h1 className="text-2xl font-bold text-white mb-1">{artwork.title || 'Untitled'}</h1>
            <p className="text-gray-500 text-sm mb-6">{artwork.medium}</p>
            <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden mb-6">
              {fields.map((pair, i) => (
                <div key={pair[0] as string} className={'flex justify-between px-4 py-3' + (i < fields.length - 1 ? ' border-b border-[#1a1a1a]' : '')}>
                  <span className="text-xs text-gray-500">{pair[0]}</span>
                  <span className={'text-xs font-medium ' + (pair[0] === 'Status' && pair[1] === 'Sold' ? 'text-green-400' : pair[0] === 'Status' ? 'text-purple-400' : 'text-white')}>
                    {pair[1]}
                  </span>
                </div>
              ))}
            </div>
            {artwork.originalUrl && (
              <a href={artwork.originalUrl} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-6 py-3 border border-purple-700 hover:bg-purple-700 text-purple-400 hover:text-white text-sm rounded-xl transition-all">
                Download Full Resolution
              </a>
            )}
          </div>
        </div>
      </div>
      {enlarged && (
        <div onClick={() => setEnlarged(false)} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out">
          <img src={artwork.imageUrl} alt={artwork.title} className="max-w-full max-h-full object-contain rounded-xl" />
          <button onClick={() => setEnlarged(false)} className="absolute top-4 right-4 text-white text-2xl">X</button>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl mb-2">Delete this artwork?</div>
            <p className="text-gray-500 text-sm mb-8">This will permanently remove this work. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-3 border border-[#333] text-gray-400 text-sm rounded-xl">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white text-sm rounded-xl">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
