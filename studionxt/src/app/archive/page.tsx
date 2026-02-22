'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface Artwork {
  id: string;
  title: string;
  year: string;
  medium: string;
  dimensions: string;
  status: string;
  price: string;
  imageUrl: string;
}

export default function Archive() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    async function loadArtworks() {
      try {
        const userId = auth.currentUser?.uid || 'demo-user';
        const snapshot = await getDocs(
          collection(db, 'artists', userId, 'artworks')
        );
        const works = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Artwork[];
        setArtworks(works);
      } catch (error) {
        console.error('Error loading artworks:', error);
      } finally {
        setLoading(false);
      }
    }
    loadArtworks();
  }, []);

  function goToArtwork(id: string) {
    router.push(`/archive/artwork?id=${id}`);
  }

  const statuses = ['All', 'Available', 'Sold', 'Consigned', 'Not for sale'];
  const filtered = filter === 'All'
    ? artworks
    : artworks.filter(w => w.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-purple-400 text-sm">Loading archive...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Archive</div>
            <h1 className="text-2xl font-bold text-white">
              {artworks.length} {artworks.length === 1 ? 'Work' : 'Works'}
            </h1>
          </div>
          <button
            onClick={() => router.push('/upload')}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all"
          >+ Add Artwork</button>
        </div>

        <div className="flex gap-3 mb-8 flex-wrap items-center">
          <div className="flex gap-2 flex-wrap flex-1">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-full border text-xs transition-all ${
                  filter === s
                    ? 'border-purple-500 bg-purple-900 text-purple-200'
                    : 'border-[#333] text-gray-400 hover:border-purple-700'
                }`}
              >{s}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['grid', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded border text-xs transition-all ${
                  view === v
                    ? 'border-purple-500 bg-purple-900 text-purple-200'
                    : 'border-[#333] text-gray-400'
                }`}
              >{v === 'grid' ? '⊞ Grid' : '≡ List'}</button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">🖼</div>
            <div className="text-gray-500 text-sm mb-6">
              {filter === 'All' ? 'No works archived yet.' : `No works with status: ${filter}`}
            </div>
            {filter === 'All' && (
              <button
                onClick={() => router.push('/upload')}
                className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all"
              >Upload first artwork</button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map(work => (
              <div
                key={work.id}
                onClick={() => goToArtwork(work.id)}
                className="bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-purple-700 transition-all cursor-pointer group"
              >
                {work.imageUrl ? (
                  <img
                    src={work.imageUrl}
                    alt={work.title}
                    className="w-full h-48 object-cover group-hover:opacity-90 transition-all"
                  />
                ) : (
                  <div className="w-full h-48 bg-[#1a1a1a] flex items-center justify-center text-3xl">🖼</div>
                )}
                <div className="p-4">
                  <div className="font-semibold text-white text-sm mb-1 truncate">
                    {work.title || 'Untitled'}
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {work.year}{work.medium ? ` · ${work.medium}` : ''}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      work.status === 'Sold'
                        ? 'border-green-800 text-green-400'
                        : work.status === 'Consigned'
                        ? 'border-yellow-800 text-yellow-400'
                        : 'border-purple-800 text-purple-400'
                    }`}>
                      {work.status || 'Available'}
                    </span>
                    {work.price && (
                      <span className="text-xs text-gray-400">{work.price}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222]">
                  {['Image', 'Title', 'Year', 'Medium', 'Status', 'Price'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((work, i) => (
                  <tr
                    key={work.id}
                    onClick={() => goToArtwork(work.id)}
                    className={`hover:bg-[#1a1a1a] transition-all cursor-pointer ${
                      i < filtered.length - 1 ? 'border-b border-[#1a1a1a]' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      {work.imageUrl ? (
                        <img
                          src={work.imageUrl}
                          alt={work.title}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center text-sm">🖼</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {work.title || 'Untitled'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{work.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{work.medium}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        work.status === 'Sold'
                          ? 'border-green-800 text-green-400'
                          : 'border-purple-800 text-purple-400'
                      }`}>
                        {work.status || 'Available'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{work.price || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
