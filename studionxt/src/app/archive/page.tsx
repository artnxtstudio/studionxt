'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Suspense } from 'react';

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
    <div className="bg-[#171410] border border-[#2E2820] rounded-xl overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-[#1E1A16]" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-[#222] rounded w-3/4" />
        <div className="h-3 bg-[#222] rounded w-1/2" />
      </div>
    </div>
  );
}

function ThreeDotMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1E1A16] hover:bg-[#222] text-gray-400 hover:text-[#F5F0EB] transition-all text-base leading-none">
        ···
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-[#1E1A16] border border-[#3D3530] rounded-xl overflow-hidden z-20 w-32 shadow-xl">
          <button onClick={() => { setOpen(false); onEdit(); }} className="w-full text-left px-4 py-3 text-xs text-[#F5F0EB] hover:bg-[#222] transition-all">Edit</button>
          <button onClick={() => { setOpen(false); onDelete(); }} className="w-full text-left px-4 py-3 text-xs text-red-400 hover:bg-[#222] transition-all border-t border-[#3D3530]">Delete</button>
        </div>
      )}
    </div>
  );
}

function WorksTab() {
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
        setArtworks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Artwork[]);
      } catch (error) {
        console.error(error);
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

  const statuses = ['All', 'Available', 'Sold', 'Consigned', 'Not for sale'];
  const filtered = filter === 'All' ? artworks : artworks.filter(w => w.status === filter);
  const workToDelete = artworks.find(w => w.id === confirmDelete);

  return (
    <div>
      <div className="flex gap-3 mb-6 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={'px-3 py-1 rounded-full border text-xs transition-all ' + (filter === s ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-[#3D3530] text-gray-400 hover:border-purple-700')}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} className={'px-3 py-1.5 rounded border text-xs transition-all ' + (view === v ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-[#3D3530] text-gray-400')}>
              {v === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#171410] border border-[#2E2820] flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          {filter === 'All' ? (
            <>
              <div className="text-[#F5F0EB] font-semibold text-xl mb-3 text-center" style={{fontFamily:"var(--font-playfair)"}}>No works archived yet</div>
              <div className="text-gray-500 text-sm text-center max-w-xs mb-8 leading-relaxed">Every work you add becomes a permanent searchable record. Start with one photograph.</div>
              <button onClick={() => router.push('/upload')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all">
                Add your first work
              </button>
            </>
          ) : (
            <>
              <div className="text-[#F5F0EB] font-semibold mb-2">No works with this status</div>
              <div className="text-gray-500 text-sm">Try a different filter above</div>
            </>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(work => (
            <div key={work.id} className="bg-[#171410] border border-[#2E2820] rounded-xl overflow-hidden hover:border-purple-700 transition-all group relative">
              <div onClick={() => router.push('/artwork?id=' + work.id)} className="cursor-pointer">
                {work.imageUrl ? (
                  <img src={work.imageUrl} alt={work.title} className="w-full h-36 sm:h-48 object-cover group-hover:opacity-90 transition-all" />
                ) : (
                  <div className="w-full h-36 sm:h-48 bg-[#1E1A16] flex items-center justify-center text-3xl">🖼</div>
                )}
              </div>
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-1">
                  <div onClick={() => router.push('/artwork?id=' + work.id)} className="font-semibold text-[#F5F0EB] text-xs sm:text-sm truncate flex-1 cursor-pointer">
                    {work.title || 'Untitled'}
                  </div>
                  <ThreeDotMenu onEdit={() => router.push('/artwork?id=' + work.id + '&edit=true')} onDelete={() => setConfirmDelete(work.id)} />
                </div>
                <div onClick={() => router.push('/artwork?id=' + work.id)} className="cursor-pointer">
                  <div className="text-xs text-gray-500 mb-2 truncate">{work.year}{work.medium ? ' · ' + work.medium : ''}</div>
                  <span className={'text-xs px-2 py-0.5 rounded-full border ' + (work.status === 'Sold' ? 'border-green-800 text-green-400' : work.status === 'Consigned' ? 'border-yellow-800 text-yellow-400' : 'border-purple-800 text-purple-400')}>
                    {work.status || 'Available'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'list' && (
        <div className="bg-[#171410] border border-[#2E2820] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E2820]">
                {['Image', 'Title', 'Year', 'Medium', 'Status', 'Price', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((work, i) => (
                <tr key={work.id} className={'hover:bg-[#1E1A16] transition-all ' + (i < filtered.length - 1 ? 'border-b border-[#2A2318]' : '')}>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => router.push('/artwork?id=' + work.id)}>
                    {work.imageUrl ? <img src={work.imageUrl} alt={work.title} className="w-10 h-10 object-cover rounded" /> : <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center">🖼</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#F5F0EB] font-medium cursor-pointer" onClick={() => router.push('/artwork?id=' + work.id)}>{work.title || 'Untitled'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{work.year}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{work.medium}</td>
                  <td className="px-4 py-3">
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + (work.status === 'Sold' ? 'border-green-800 text-green-400' : 'border-purple-800 text-purple-400')}>
                      {work.status || 'Available'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{work.price || '—'}</td>
                  <td className="px-4 py-3">
                    <ThreeDotMenu onEdit={() => router.push('/artwork?id=' + work.id + '&edit=true')} onDelete={() => setConfirmDelete(work.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#171410] border border-[#3D3530] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl mb-2">Delete this artwork?</div>
            <p className="text-gray-500 text-sm mb-8">This will permanently remove "{workToDelete?.title || 'Untitled'}" from the archive.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-3 border border-[#3D3530] text-gray-400 text-sm rounded-xl">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting} className="flex-1 px-4 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-xl">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VoicesTab() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('demo-user');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const uid = user?.uid || 'demo-user';
        setUserId(uid);
        const snapshot = await getDocs(collection(db, 'artists', uid, 'voices'));
        setSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div className="flex gap-3 mb-8 flex-wrap">
        <button onClick={() => router.push('/archive/voices/new?mode=guided')} className="flex-1 sm:flex-none px-5 py-3 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all">
          Guided session — Mira asks questions
        </button>
        <button onClick={() => router.push('/archive/voices/new?mode=free')} className="flex-1 sm:flex-none px-5 py-3 border border-[#3D3530] hover:border-purple-700 text-gray-300 text-sm rounded-xl transition-all">
          Free session — just talk
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-[#171410] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#171410] border border-[#2E2820] flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
            </svg>
          </div>
          <div className="text-[#F5F0EB] font-semibold text-xl mb-3 text-center" style={{fontFamily:"var(--font-playfair)"}}>No voice sessions yet</div>
          <div className="text-gray-500 text-sm text-center max-w-xs mb-8 leading-relaxed">Let Mira ask the questions. Talk about a work, a period, an idea. Your words become part of the archive.</div>
          <button onClick={() => router.push('/archive/voices/new')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all">
            Start a voice session
          </button>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session.id} onClick={() => router.push('/archive/voices/' + session.id)} className="bg-[#171410] border border-[#2E2820] rounded-xl p-4 hover:border-purple-700 cursor-pointer transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-[#F5F0EB] font-medium">{session.title || 'Untitled session'}</div>
                <div className="text-xs text-gray-600">{session.createdAt ? new Date(session.createdAt).toLocaleDateString() : ''}</div>
              </div>
              <div className="text-xs text-gray-500 mb-2">{session.topic || 'General practice'} · {session.mode === 'guided' ? 'Guided' : 'Free'}</div>
              {session.summary && <div className="text-xs text-gray-600 line-clamp-2">{session.summary}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentsTab() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState('demo-user');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const uid = user?.uid || 'demo-user';
        setUserId(uid);
        const snapshot = await getDocs(collection(db, 'artists', uid, 'documents'));
        setDocs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      const timestamp = Date.now();
      const fileRef = ref(storage, 'documents/' + userId + '/' + timestamp + '_' + file.name);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      const newDoc = {
        name: file.name,
        url,
        type: 'Document',
        size: (file.size / 1024).toFixed(0) + ' KB',
        createdAt: new Date().toISOString(),
        userId,
      };
      const docRef = doc(db, 'artists', userId, 'documents', timestamp.toString());
      await setDoc(docRef, newDoc);
      setDocs(prev => [{ id: timestamp.toString(), ...newDoc }, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  const DOC_TYPES = ['Contract', 'Certificate', 'Press', 'Catalogue', 'Invoice', 'Provenance', 'Other'];

  const typeIcon: Record<string, string> = {
    Contract: '📄', Certificate: '🏛', Press: '📰',
    Catalogue: '📚', Invoice: '🧾', Provenance: '🔍', Other: '📎', Document: '📎'
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <label className={'px-5 py-3 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all cursor-pointer ' + (uploading ? 'opacity-50' : '')}>
          {uploading ? 'Uploading...' : '+ Upload document'}
          <input type="file" onChange={handleUpload} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
        </label>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-[#171410] rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#171410] border border-[#2E2820] flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="text-[#F5F0EB] font-semibold text-xl mb-3 text-center" style={{fontFamily:"var(--font-playfair)"}}>No documents yet</div>
          <div className="text-gray-500 text-sm text-center max-w-xs mb-2 leading-relaxed">Contracts, certificates, press, catalogues, invoices.</div>
          <div className="text-gray-600 text-xs text-center max-w-xs mb-8">Everything related to your practice belongs here.</div>
          <button onClick={() => router.push('/archive/documents')} className="px-6 py-3 bg-[#171410] border border-[#3D3530] hover:border-purple-700 text-gray-300 text-sm rounded-xl transition-all">
            Upload a document
          </button>
        </div>
      )}

      {!loading && docs.length > 0 && (
        <div className="space-y-2">
          {docs.map(d => (
            <div key={d.id} onClick={() => router.push('/archive/documents/' + d.id)} className="flex items-center gap-4 bg-[#171410] border border-[#2E2820] rounded-xl p-4 hover:border-purple-700 transition-all group cursor-pointer">
              <div className="text-2xl">{typeIcon[d.type] || '📎'}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[#F5F0EB] font-medium truncate">{d.name}</div>
                <div className="text-xs text-gray-500">{d.type} · {d.size}</div>
              </div>
              <div className="text-xs text-gray-600 group-hover:text-purple-400 transition-all">View →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function WipTab() {
  const router = useRouter();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || 'demo-user';
      try {
        const snap = await getDocs(collection(db, 'artists', uid, 'wip'));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setWorks(items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const statusColor: Record<string, string> = {
    Active: 'border-green-800 text-green-400',
    Paused: 'border-yellow-800 text-yellow-400',
    Abandoned: 'border-red-900 text-red-500',
    Completed: 'border-blue-800 text-blue-400',
  };

  const statuses = ['All', 'Active', 'Paused', 'Abandoned', 'Completed'];
  const filtered = filter === 'All' ? works : works.filter((w: any) => w.status === filter);

  return (
    <div>
      <div className="flex gap-3 mb-6 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={'px-3 py-1 rounded-full border text-xs transition-all ' + (filter === s ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-[#3D3530] text-gray-400 hover:border-purple-700')}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/archive/wip/new')} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-xs rounded-lg transition-all">
            + New WIP
          </button>
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={'px-3 py-1.5 rounded border text-xs transition-all ' + (view === v ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-[#3D3530] text-gray-400')}>
              {v === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#171410] rounded-2xl overflow-hidden animate-pulse">
              <div className="h-48 bg-[#1E1A16]" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-[#222] rounded w-1/2" />
                <div className="h-3 bg-[#222] rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-2xl bg-[#171410] border border-[#2E2820] flex items-center justify-center mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          {filter === 'All' ? (
            <>
              <div className="text-[#F5F0EB] font-semibold text-xl mb-3 text-center" style={{fontFamily:"var(--font-playfair)"}}>Nothing in progress</div>
              <div className="text-gray-500 text-sm text-center max-w-xs mb-8 leading-relaxed">Track a work as you make it. Mira follows the process and builds the story behind the piece.</div>
              <button onClick={() => router.push('/archive/wip/new')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all">
                Start tracking a work
              </button>
            </>
          ) : (
            <div className="text-gray-500 text-sm">No {filter} works</div>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((work: any) => (
            <div key={work.id} onClick={() => router.push('/archive/wip/' + work.id)}
              className="bg-[#171410] border border-[#2E2820] rounded-xl overflow-hidden hover:border-purple-700 transition-all cursor-pointer group">
              {work.timeline && work.timeline.length > 0 ? (
                <img src={work.timeline[work.timeline.length - 1].imageUrl} alt={work.title}
                  className="w-full h-36 sm:h-48 object-contain bg-[#0D0B09] group-hover:opacity-90 transition-all" />
              ) : (
                <div className="w-full h-36 sm:h-48 bg-[#1E1A16] flex items-center justify-center">
                  <span className="text-3xl opacity-20">🎨</span>
                </div>
              )}
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs sm:text-sm font-medium text-[#F5F0EB] truncate flex-1 mr-2">{work.title || 'Untitled'}</div>
                  <span className={'text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ' + (statusColor[work.status] || 'border-purple-800 text-purple-400')}>
                    {work.status || 'Active'}
                  </span>
                </div>
                {work.problem && <div className="text-xs text-gray-500 line-clamp-2 mt-1">{work.problem}</div>}
                <div className="text-xs text-gray-600 mt-2">
                  {work.timeline ? work.timeline.length : 0} photos · {work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'list' && (
        <div className="bg-[#171410] border border-[#2E2820] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2E2820]">
                {['Photo', 'Title', 'Problem', 'Photos', 'Status', 'Started'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((work: any, i: number) => (
                <tr key={work.id} onClick={() => router.push('/archive/wip/' + work.id)}
                  className={'hover:bg-[#1E1A16] transition-all cursor-pointer ' + (i < filtered.length - 1 ? 'border-b border-[#2A2318]' : '')}>
                  <td className="px-4 py-3">
                    {work.timeline && work.timeline.length > 0 ? (
                      <img src={work.timeline[work.timeline.length - 1].imageUrl} alt="" className="w-10 h-10 object-contain bg-[#0D0B09] rounded" />
                    ) : (
                      <div className="w-10 h-10 bg-[#222] rounded flex items-center justify-center text-lg">🎨</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#F5F0EB] font-medium">{work.title || 'Untitled'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs"><div className="line-clamp-2">{work.problem || '—'}</div></td>
                  <td className="px-4 py-3 text-sm text-gray-400">{work.timeline ? work.timeline.length : 0}</td>
                  <td className="px-4 py-3">
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + (statusColor[work.status] || 'border-purple-800 text-purple-400')}>
                      {work.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Archive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'works' | 'voices' | 'documents' | 'wip'>(() => {
    const t = searchParams.get('tab');
    if (t === 'voices' || t === 'documents') return t;
    return 'works';
  });
  const [artworkCount, setArtworkCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const uid = user?.uid || 'demo-user';
        const snapshot = await getDocs(collection(db, 'artists', uid, 'artworks'));
        setArtworkCount(snapshot.size);
      } catch (err) {
        console.error(err);
      }
    });
    return () => unsubscribe();
  }, []);

  const tabs = [
    { id: 'works', label: 'Works' },
    { id: 'voices', label: 'Voices' },
    { id: 'documents', label: 'Documents' },
    { id: 'wip', label: 'Studio' },
  ];

  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Archive</div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F0EB]">
              {artworkCount !== null ? artworkCount + ' ' + (artworkCount === 1 ? 'Work' : 'Works') : 'Archive'}
            </h1>
          </div>
          {tab === 'works' && (
            <button onClick={() => router.push('/upload')} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-xs sm:text-sm rounded-lg transition-all">
              + Add Artwork
            </button>
          )}
        </div>

        <div className="flex gap-1 mb-8 bg-[#171410] border border-[#2E2820] rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={'flex-1 py-2 text-sm rounded-lg transition-all ' + (tab === t.id ? 'bg-purple-700 text-[#F5F0EB] font-medium' : 'text-gray-400 hover:text-[#F5F0EB]')}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'works' && <WorksTab />}
        {tab === 'voices' && <VoicesTab />}
        {tab === 'documents' && <DocumentsTab />}
        {tab === 'wip' && <WipTab />}

      </div>
    </div>
  );
}
