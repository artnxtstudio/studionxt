'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

function ThreeDotMenu({ workId, onEdit, onDelete }: { workId: string; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1a1a1a] hover:bg-[#222] text-gray-400 hover:text-white transition-all text-lg leading-none"
      >
        ···
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden z-20 w-32 shadow-xl">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full text-left px-4 py-3 text-xs text-white hover:bg-[#222] transition-all"
          >
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full text-left px-4 py-3 text-xs text-red-400 hover:bg-[#222] transition-all border-t border-[#333]"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function Archive() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');
  const [userId, setUserId] = useState('demo-user');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const uid = user?.uid || 'demo-user';
        setUserId(uid);
        const snapshot = await getDocs(collection(db, 'artists', uid, 'artworks'));
        const works = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Artwork[];
        setArtworks(works);
      } catch (error) {
        console.error('Error loading artworks:', error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'artists', userId, 'artworks', id));
      setArtworks(prev => prev.filter(w => w.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  function goToArtwork(id: string) { router.push('/artwork?id=' + id); }
  function goToEdit(id: string) { router.push('/artwork?id=' + id + '&edit=true'); }

  const statuses = ['All', 'Available', 'Sold', 'Consigned', 'Not for sale'];
  const filtered = filter === 'All' ? artworks : artworks.filter(w => w.status === filter);
  const workToDelete = artworks.find(w => w.id === confirmDelete);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Archive</div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {loading ? 'Loading...' : artworks.length + ' ' + (artworks.length === 1 ? 'Work' : 'Works')}
            </h1>
          </div>
          <button onClick={() => router.push('/upload')} className="px-3 sm:px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs sm:text-sm rounded-lg transition-all">
            + Add Artwork
          </button>
        </div>

        <div className="flex gap-3 mb-6 sm:mb-8 items-center justify-between flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={'px-3 py-1 rounded-full border text-xs transition-all ' + (filter === s ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-[#333] text-gray-400 hover:border-purple-700')}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {(['grid', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={'px-3 py-1.5 rounded border text-xs transition-all ' + (view === v ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-[#333] text-gray-400')}>
                {v === 'grid' ? '⊞' : '≡'}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-4xl mb-4">🖼</div>
            <div className="text-gray-500 text-sm mb-6">
              {filter === 'All' ? 'No works archived yet.' : 'No works with status: ' + filter}
            </div>
            {filter === 'All' && (
              <button onClick={() => router.push('/upload')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all">
                Upload first artwork
              </button>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && view === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {filtered.map(work => (
              <div key={work.id} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-purple-700 transition-all group relative">
                <div onClick={() => goToArtwork(work.id)} className="cursor-pointer">
                  {work.imageUrl ? (
                    <img src={work.imageUrl} alt={work.title} className="w-full h-36 sm:h-48 object-cover group-hover:opacity-90 transition-all" />
                  ) : (
                    <div className="w-full h-36 sm:h-48 bg-[#1a1a1a] flex items-center justify-center text-3xl">🖼</div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <div className="flex justify-between items-start mb-1">
                    <div onClick={() => goToArtwork(work.id)} className="font-semibold text-white text-xs sm:text-sm truncate flex-1 cursor-pointer">
                      {work.title || 'Untitled'}
                    </div>
                    <ThreeDotMenu
                      workId={work.id}
                      onEdit={() => goToEdit(work.id)}
                      onDelete={() => setConfirmDelete(work.id)}
                    />
                  </div>
                  <div onClick={() => goToArtwork(work.id)} className="cursor-pointer">
                    <div className="text-xs text-gray-500 mb-2 sm:mb-3 truncate">
                      {work.year}{work.medium ? ' · ' + work.medium : ''}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={'text-xs px-2 py-0.5 rounded-full border ' + (work.status === 'Sold' ? 'border-green-800 text-green-400' : work.status === 'Consigned' ? 'border-yellow-800 text-yellow-400' : 'border-purple-800 text-purple-400')}>
                        {work.status || 'Available'}
                      </span>
                      {work.price && <span className="text-xs text-gray-400 hidden sm:block">{work.price}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && view === 'list' && (
          <>
            <div className="space-y-3 sm:hidden">
              {filtered.map(work => (
                <div key={work.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex gap-4 items-center hover:border-purple-700 transition-all">
                  <div onClick={() => goToArtwork(work.id)} className="flex gap-4 items-center flex-1 min-w-0 cursor-pointer">
                    {work.imageUrl ? (
                      <img src={work.imageUrl} alt={work.title} className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-[#222] rounded-lg flex items-center justify-center text-lg flex-shrink-0">🖼</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate">{work.title || 'Untitled'}</div>
                      <div className="text-xs text-gray-500">{work.year}{work.medium ? ' · ' + work.medium : ''}</div>
                    </div>
                  </div>
                  <ThreeDotMenu workId={work.id} onEdit={() => goToEdit(work.id)} onDelete={() => setConfirmDelete(work.id)} />
                </div>
              ))}
            </div>

            <div className="hidden sm:block bg-[#111] border border-[#222] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#222]">
                    {['Image', 'Title', 'Year', 'Medium', 'Status', 'Price', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((work, i) => (
                    <tr key={work.id} className={'hover:bg-[#1a1a1a] transition-all ' + (i < filtered.length - 1 ? 'border-b border-[#1a1a1a]' : '')}>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => goToArtwork(work.id)}>
                        {work.imageUrl ? (
                          <img src={work.imageUrl} alt={work.title} className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center text-sm">🖼</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-white font-medium cursor-pointer" onClick={() => goToArtwork(work.id)}>{work.title || 'Untitled'}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 cursor-pointer" onClick={() => goToArtwork(work.id)}>{work.year}</td>
                      <td className="px-4 py-3 text-sm text-gray-400 cursor-pointer" onClick={() => goToArtwork(work.id)}>{work.medium}</td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => goToArtwork(work.id)}>
                        <span className={'text-xs px-2 py-0.5 rounded-full border ' + (work.status === 'Sold' ? 'border-green-800 text-green-400' : 'border-purple-800 text-purple-400')}>
                          {work.status || 'Available'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400 cursor-pointer" onClick={() => goToArtwork(work.id)}>{work.price || '—'}</td>
                      <td className="px-4 py-3">
                        <ThreeDotMenu workId={work.id} onEdit={() => goToEdit(work.id)} onDelete={() => setConfirmDelete(work.id)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#333] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl mb-2">Delete this artwork?</div>
            <p className="text-gray-500 text-sm mb-8">
              This will permanently remove "{workToDelete?.title || 'Untitled'}" from the archive. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-3 border border-[#333] text-gray-400 text-sm rounded-xl hover:border-gray-500 transition-all">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting} className="flex-1 px-4 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white text-sm rounded-xl transition-all">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
