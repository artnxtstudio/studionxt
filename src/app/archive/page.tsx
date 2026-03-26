'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// ── Shared SVG icon components ────────────────────────────────────────────────

function IconImage({ size = 28, stroke = '#444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

function IconBrush({ size = 28, stroke = '#444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3z"/>
      <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/>
    </svg>
  );
}

function IconMic({ size = 28, stroke = '#444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/>
    </svg>
  );
}

function IconDoc({ size = 28, stroke = '#444' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function IconGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  );
}

function IconList() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}

// Doc type icon — SVG only, no emoji
function DocTypeIcon({ type }: { type: string }) {
  const stroke = '#8A8480';
  switch (type) {
    case 'Contract':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
    case 'Certificate':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
    case 'Press':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>;
    case 'Catalogue':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
    case 'Invoice':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
    case 'Provenance':
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
    default:
      return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
  }
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-default rounded-xl overflow-hidden animate-pulse">
      <div className="w-full h-48 bg-card-hover" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-card-hover rounded w-3/4" />
        <div className="h-3 bg-card-hover rounded w-1/2" />
      </div>
    </div>
  );
}

function ThreeDotMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-card-hover text-secondary hover:text-primary transition-all text-sm font-bold tracking-widest">
        ···
      </button>
      {open && (
        <div className="absolute right-0 top-9 bg-card border border-default rounded-xl overflow-hidden z-50 w-36 shadow-xl">
          <button onClick={() => { setOpen(false); onEdit(); }} className="w-full text-left px-4 py-3 text-xs text-primary hover:bg-card-hover transition-all">Edit</button>
          <button onClick={() => { setOpen(false); onDelete(); }} className="w-full text-left px-4 py-3 text-xs text-red-400 hover:bg-card-hover transition-all border-t border-default">Delete</button>
        </div>
      )}
    </div>
  );
}

// ── Works Tab ─────────────────────────────────────────────────────────────────

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

function WorksTab() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');
  const [userId, setUserId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const uid = user.uid;
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

  const chipBase = 'px-3 py-1 rounded-full border text-xs transition-all ';
  const chipActive = 'border-purple-500 bg-purple-900/30 text-purple-300';
  const chipInactive = 'border-default text-secondary hover:border-purple-700 hover:text-primary';

  return (
    <div>
      <div className="flex gap-3 mb-6 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={chipBase + (filter === s ? chipActive : chipInactive)}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={'p-2 rounded border transition-all ' + (view === v ? 'border-purple-500 bg-purple-900/30 text-purple-300' : 'border-default text-secondary hover:border-purple-700 hover:text-primary')}>
              {v === 'grid' ? <IconGrid /> : <IconList />}
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
          <div className="w-16 h-16 rounded-2xl bg-card border border-default flex items-center justify-center mb-6">
            <IconImage />
          </div>
          {filter === 'All' ? (
            <>
              <div className="text-primary font-semibold text-xl mb-3 text-center" style={{fontFamily:'var(--font-playfair)'}}>No works archived yet</div>
              <div className="text-secondary text-sm text-center max-w-xs mb-8 leading-relaxed">Every work you add becomes a permanent searchable record. Start with one photograph.</div>
              <button onClick={() => router.push('/upload')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">
                Add your first work
              </button>
            </>
          ) : (
            <>
              <div className="text-primary font-semibold mb-2">No works with this status</div>
              <div className="text-secondary text-sm">Try a different filter above</div>
            </>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(work => (
            <div key={work.id} className="bg-card border border-default rounded-xl overflow-hidden hover:border-purple-700 transition-all group relative">
              <div onClick={() => router.push('/artwork?id=' + work.id)} className="cursor-pointer">
                {work.imageUrl
                  ? <img src={work.imageUrl} alt={work.title} className="w-full h-36 sm:h-48 object-cover" />
                  : <div className="w-full h-36 sm:h-48 bg-card-hover flex items-center justify-center"><IconImage size={36} stroke="#2E2820" /></div>
                }
              </div>
              <div className="p-3 sm:p-4 flex items-end justify-between gap-2">
                <div onClick={() => router.push('/artwork?id=' + work.id)} className="cursor-pointer flex-1 min-w-0">
                  <div className="font-semibold text-primary text-xs sm:text-sm truncate mb-1">{work.title || 'Untitled'}</div>
                  <div className="text-xs text-secondary mb-2 truncate">{work.year}{work.medium ? ' · ' + work.medium : ''}</div>
                  <span className={'text-xs px-2 py-0.5 rounded-full border ' + (work.status === 'Sold' ? 'border-green-800 text-green-400' : work.status === 'Consigned' ? 'border-yellow-800 text-yellow-400' : 'border-purple-800 text-purple-400')}>
                    {work.status || 'Available'}
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); router.push('/artwork?id=' + work.id + '&edit=true'); }}
                    title="Edit"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-purple-700 transition-all"
                    style={{background:'rgba(126,34,206,0.15)'}}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDelete(work.id); }}
                    title="Delete"
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-800 transition-all"
                    style={{background:'rgba(126,34,206,0.15)'}}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'list' && (
        <div className="bg-card border border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-default">
                {['Image','Title','Year','Medium','Status','Price',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((work, i) => (
                <tr key={work.id} className={'hover:bg-card-hover transition-all ' + (i < filtered.length - 1 ? 'border-b border-default' : '')}>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => router.push('/artwork?id=' + work.id)}>
                    {work.imageUrl
                      ? <img src={work.imageUrl} alt={work.title} className="w-10 h-10 object-cover rounded" />
                      : <div className="w-10 h-10 bg-card-hover rounded flex items-center justify-center"><IconImage size={16} stroke="#504840" /></div>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-primary font-medium cursor-pointer" onClick={() => router.push('/artwork?id=' + work.id)}>{work.title || 'Untitled'}</td>
                  <td className="px-4 py-3 text-sm text-secondary">{work.year}</td>
                  <td className="px-4 py-3 text-sm text-secondary">{work.medium}</td>
                  <td className="px-4 py-3">
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + (work.status === 'Sold' ? 'border-green-800 text-green-400' : 'border-purple-800 text-purple-400')}>
                      {work.status || 'Available'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary">{work.price ? '€' + work.price : '—'}</td>
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
          <div className="bg-card border border-default rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl mb-2" style={{fontFamily:'var(--font-playfair)'}}>Delete this artwork?</div>
            <p className="text-secondary text-sm mb-8">This will permanently remove "{workToDelete?.title || 'Untitled'}" from the archive. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-3 border border-default text-secondary text-sm rounded-xl hover:border-purple-700 transition-all">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting} className="flex-1 px-4 py-3 bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white text-sm rounded-xl transition-all">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Voices Tab ────────────────────────────────────────────────────────────────

function VoicesTab() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snapshot = await getDocs(collection(db, 'artists', user.uid, 'voices'));
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
        <button onClick={() => router.push('/archive/voices/new?mode=guided')} className="flex-1 sm:flex-none px-5 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">
          Guided session — Mira asks questions
        </button>
        <button onClick={() => router.push('/archive/voices/new?mode=free')} className="flex-1 sm:flex-none px-5 py-3 border border-default hover:border-purple-700 hover:text-primary text-secondary text-sm rounded-xl transition-all">
          Free session — just talk
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-2xl bg-card border border-default flex items-center justify-center mb-6">
            <IconMic />
          </div>
          <div className="text-primary font-semibold text-xl mb-3 text-center" style={{fontFamily:'var(--font-playfair)'}}>No voice sessions yet</div>
          <div className="text-secondary text-sm text-center max-w-xs mb-8 leading-relaxed">Let Mira ask the questions. Talk about a work, a period, an idea. Your words become part of the archive.</div>
          <button onClick={() => router.push('/archive/voices/new')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">
            Start a voice session
          </button>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map(session => (
            <div key={session.id} onClick={() => router.push('/archive/voices/' + session.id)}
              className="bg-card border border-default rounded-xl p-4 hover:border-purple-700 cursor-pointer transition-all">
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-primary font-medium">{session.title || 'Untitled session'}</div>
                <div className="text-xs text-muted">{session.createdAt ? new Date(session.createdAt).toLocaleDateString('en-GB') : ''}</div>
              </div>
              <div className="text-xs text-secondary mb-2">{session.topic || 'General practice'} · {session.mode === 'guided' ? 'Guided' : 'Free'}</div>
              {session.summary && <div className="text-xs text-muted line-clamp-2">{session.summary}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Documents Tab ─────────────────────────────────────────────────────────────

function DocumentsTab() {
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const uid = user.uid;
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
      const fileRef = ref(storage, `documents/${userId}/${timestamp}_${file.name}`);
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
      console.error('Document upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <label className={'px-5 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all cursor-pointer inline-flex items-center gap-2 ' + (uploading ? 'opacity-50 pointer-events-none' : '')}>
          {uploading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Uploading...
            </>
          ) : '+ Upload document'}
          <input type="file" onChange={handleUpload} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" />
        </label>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && docs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-2xl bg-card border border-default flex items-center justify-center mb-6">
            <IconDoc />
          </div>
          <div className="text-primary font-semibold text-xl mb-3 text-center" style={{fontFamily:'var(--font-playfair)'}}>No documents yet</div>
          <div className="text-secondary text-sm text-center max-w-xs mb-2 leading-relaxed">Contracts, certificates, press, catalogues, invoices.</div>
          <div className="text-muted text-xs text-center max-w-xs mb-8">Everything related to your practice belongs here.</div>
        </div>
      )}

      {!loading && docs.length > 0 && (
        <div className="space-y-2">
          {docs.map(d => (
            <div key={d.id} onClick={() => window.open(d.url, '_blank')}
              className="flex items-center gap-4 bg-card border border-default rounded-xl p-4 hover:border-purple-700 transition-all group cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-card-hover flex items-center justify-center flex-shrink-0">
                <DocTypeIcon type={d.type} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-primary font-medium truncate">{d.name}</div>
                <div className="text-xs text-secondary">{d.type} · {d.size}</div>
              </div>
              <div className="text-xs text-muted group-hover:text-purple-400 transition-all flex-shrink-0">View →</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Studio / WIP Tab ──────────────────────────────────────────────────────────

function WipTab() {
  const router = useRouter();
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDocs(collection(db, 'artists', user.uid, 'wip'));
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
    Active:    'border-green-800 text-green-400',
    Paused:    'border-yellow-800 text-yellow-400',
    Abandoned: 'border-red-900 text-red-500',
    Completed: 'border-blue-800 text-blue-400',
  };

  const statuses = ['All', 'Active', 'Paused', 'Abandoned', 'Completed'];
  const filtered = filter === 'All' ? works : works.filter((w: any) => w.status === filter);

  const chipBase = 'px-3 py-1 rounded-full border text-xs transition-all ';
  const chipActive = 'border-purple-500 bg-purple-900/30 text-purple-300';
  const chipInactive = 'border-default text-secondary hover:border-purple-700 hover:text-primary';

  return (
    <div>
      <div className="flex gap-3 mb-6 items-center justify-between flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={chipBase + (filter === s ? chipActive : chipInactive)}>{s}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push('/archive/wip/new')} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-lg transition-all">
            + New WIP
          </button>
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={'p-2 rounded border transition-all ' + (view === v ? 'border-purple-500 bg-purple-900/30 text-purple-300' : 'border-default text-secondary hover:border-purple-700 hover:text-primary')}>
              {v === 'grid' ? <IconGrid /> : <IconList />}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
              <div className="h-48 bg-card-hover" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-card-hover rounded w-1/2" />
                <div className="h-3 bg-card-hover rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6">
          <div className="w-16 h-16 rounded-2xl bg-card border border-default flex items-center justify-center mb-6">
            <IconBrush />
          </div>
          {filter === 'All' ? (
            <>
              <div className="text-primary font-semibold text-xl mb-3 text-center" style={{fontFamily:'var(--font-playfair)'}}>Nothing in progress</div>
              <div className="text-secondary text-sm text-center max-w-xs mb-8 leading-relaxed">Track a work as you make it. Mira follows the process and builds the story behind the piece.</div>
              <button onClick={() => router.push('/archive/wip/new')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">
                Start tracking a work
              </button>
            </>
          ) : (
            <div className="text-secondary text-sm">No {filter} works</div>
          )}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((work: any) => (
            <div key={work.id} onClick={() => router.push('/archive/wip/' + work.id)}
              className="bg-card border border-default rounded-xl overflow-hidden hover:border-purple-700 transition-all cursor-pointer group">
              {work.timeline?.length > 0
                ? <img src={work.timeline[work.timeline.length - 1].imageUrl} alt={work.title} className="w-full h-36 sm:h-48 object-contain bg-background group-hover:opacity-90 transition-all" />
                : <div className="w-full h-36 sm:h-48 bg-card-hover flex items-center justify-center"><IconBrush size={36} stroke="#2E2820" /></div>
              }
              <div className="p-3 sm:p-4">
                <div className="flex justify-between items-start mb-1">
                  <div className="text-xs sm:text-sm font-medium text-primary truncate flex-1 mr-2">{work.title || 'Untitled'}</div>
                  <span className={'text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ' + (statusColor[work.status] || 'border-purple-800 text-purple-400')}>
                    {work.status || 'Active'}
                  </span>
                </div>
                {work.problem && <div className="text-xs text-secondary line-clamp-2 mt-1">{work.problem}</div>}
                <div className="text-xs text-muted mt-2">
                  {work.timeline ? work.timeline.length : 0} photos · {work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && view === 'list' && (
        <div className="bg-card border border-default rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-default">
                {['Photo','Title','Problem','Photos','Status','Started'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-secondary uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((work: any, i: number) => (
                <tr key={work.id} onClick={() => router.push('/archive/wip/' + work.id)}
                  className={'hover:bg-card-hover transition-all cursor-pointer ' + (i < filtered.length - 1 ? 'border-b border-default' : '')}>
                  <td className="px-4 py-3">
                    {work.timeline?.length > 0
                      ? <img src={work.timeline[work.timeline.length - 1].imageUrl} alt="" className="w-10 h-10 object-contain bg-background rounded" />
                      : <div className="w-10 h-10 bg-card-hover rounded flex items-center justify-center"><IconBrush size={16} stroke="#504840" /></div>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm text-primary font-medium">{work.title || 'Untitled'}</td>
                  <td className="px-4 py-3 text-xs text-secondary max-w-xs"><div className="line-clamp-2">{work.problem || '—'}</div></td>
                  <td className="px-4 py-3 text-sm text-secondary">{work.timeline ? work.timeline.length : 0}</td>
                  <td className="px-4 py-3">
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + (statusColor[work.status] || 'border-purple-800 text-purple-400')}>
                      {work.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-secondary">
                    {work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
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

// ── Archive shell ─────────────────────────────────────────────────────────────

export default function Archive() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'works' | 'voices' | 'documents' | 'wip'>(() => {
    const t = searchParams.get('tab');
    if (t === 'voices' || t === 'documents' || t === 'wip') return t as any;
    return 'works';
  });
  const [artworkCount, setArtworkCount] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      try {
        const snapshot = await getDocs(collection(db, 'artists', user.uid, 'artworks'));
        setArtworkCount(snapshot.size);
      } catch (err) {
        console.error(err);
      }
    });
    return () => unsubscribe();
  }, []);

  const tabs = [
    { id: 'works',     label: 'Works'     },
    { id: 'voices',    label: 'Voices'    },
    { id: 'documents', label: 'Documents' },
    { id: 'wip',       label: 'Studio'    },
  ];

  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Archive</div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary" style={{fontFamily:'var(--font-playfair)'}}>
              {artworkCount !== null ? artworkCount + ' ' + (artworkCount === 1 ? 'Work' : 'Works') : 'Archive'}
            </h1>
          </div>
          {tab === 'works' && (
            <button onClick={() => router.push('/upload')} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs sm:text-sm rounded-lg transition-all">
              + Add Artwork
            </button>
          )}
        </div>

        {/* Tabs — fixed hover so text never disappears */}
        <div className="flex gap-1 mb-8 bg-card border border-default rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={'flex-1 py-2 text-sm rounded-lg transition-all ' +
                (tab === t.id
                  ? 'bg-purple-700 text-white font-medium'
                  : 'text-secondary hover:text-primary hover:bg-card-hover'
                )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'works'     && <WorksTab />}
        {tab === 'voices'    && <VoicesTab />}
        {tab === 'documents' && <DocumentsTab />}
        {tab === 'wip'       && <WipTab />}

      </div>
    </div>
  );
}
