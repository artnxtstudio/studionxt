'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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

function SkeletonCard() {
  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-[#1a1a1a]" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-[#222] rounded w-3/4" />
        <div className="h-3 bg-[#222] rounded w-1/2" />
      </div>
    </div>
  );
}

export default function Archive() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const userId = user?.uid || 'demo-user';
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
    });
    return () => unsubscribe();
  }, []);

  function goToArtwork(id: string) {
    router.push(`/artwork?id=${id}`);
  }

  const statuses = ['All', 'Available', 'Sold', 'Consigned', 'Not for sale'];
  const filtered = filter === 'All'
    ? artworks
    : artworks.filter(w => w.status === filter);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Archive</div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {loading ? 'Loading...' : `${artworks.length} ${artworks.length === 1 ? 'Work' : 'Works'}`}
            </h1>
          </div>
          <button
            onClick={() => router.push('/upload')}
            className="px-3 sm:px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs sm:text-sm rounded-lg transition-all"
          >+ Add</button>
        </div>

        {/* Filters + view toggle */}
        <div className="flex gap-3 mb-6 sm:mb-8 items-center justify-between flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full border text-xs transition-all ${
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
              >{v === 'grid' ? '⊞' : '≡'}</button>
            ))}
          </div>
        </div>

        {/* Skeleton loading */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
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
        )}

        {/* Grid view */}
        {!loading && filtered.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
                    className="w-full h-36 sm:h-48 object-cover group-hover:opacity-90 transition-all"
                  />
                ) : (
                  <div className="w-full h-36 sm:h-48 bg-[#1a1a1a] flex items-center justify-center text-3xl">🖼</div>
                )}
                <div className="p-3 sm:p-4">
                  <div className="font-semibold text-white text-xs sm:text-sm mb-1 truncate">
                    {work.title || 'Untitled'}
                  </div>
                  <div className="text-xs text-gray-500 mb-2 sm:mb-3 truncate">
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
                      <span className="text-xs text-gray-400 hidden sm:block">{work.price}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List view — hidden on mobile, show grid instead */}
        {!loading && filtered.length > 0 && view === 'list' && (
          <>
            {/* Mobile: card list */}
            <div className="space-y-3 sm:hidden">
              {filtered.map(work => (
                <div
                  key={work.id}
                  onClick={() => goToArtwork(work.id)}
                  className="bg-[#111] border border-[#222] rounded-xl p-4 flex gap-4 items-center cursor-pointer hover:border-purple-700 transition-all"
                >
                  {work.imageUrl ? (
                    <img src={work.imageUrl} alt={work.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center text-lg flex-shrink-0">🖼</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{work.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">{work.year}{work.medium ? ` · ${work.medium}` : ''}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    work.status === 'Sold' ? 'border-green-800 text-green-400' : 'border-purple-800 text-purple-400'
                  }`}>{work.status || 'Available'}</span>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden sm:block bg-[#111] border border-[#222] rounded-xl overflow-hidden">
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
                          <img src={work.imageUrl} alt={work.title} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center text-sm">🖼</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-medium">{work.title || 'Untitled'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{work.year}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{work.medium}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          work.status === 'Sold' ? 'border-green-800 text-green-400' : 'border-purple-800 text-purple-400'
                        }`}>{work.status || 'Available'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{work.price || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
