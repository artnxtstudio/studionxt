'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Folio() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [artworks, setArtworks] = useState([]);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      const uid = user.uid;
      setUserId(uid);
      try {
        const artistDoc = await getDoc(doc(db, 'artists', uid));
        if (artistDoc.exists()) setUsername(artistDoc.data().username || '');
        const snap = await getDocs(collection(db, 'artists', uid, 'artworks'));
        const works = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        works.sort((a, b) => {
          const aPublic = a.isPublic !== false;
          const bPublic = b.isPublic !== false;
          if (aPublic && !bPublic) return -1;
          if (!aPublic && bPublic) return 1;
          const aOrder = a.publicOrder !== undefined ? a.publicOrder : 999;
          const bOrder = b.publicOrder !== undefined ? b.publicOrder : 999;
          if (aPublic && bPublic) return aOrder - bOrder;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setArtworks(works);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  const publicWorks = artworks.filter(w => w.isPublic !== false);
  const privateWorks = artworks.filter(w => w.isPublic === false);

  async function togglePublic(work) {
    setSaving(work.id);
    const newValue = work.isPublic === false ? true : false;
    try {
      await updateDoc(doc(db, 'artists', userId, 'artworks', work.id), { isPublic: newValue });
      setArtworks(prev => {
        const updated = prev.map(w => w.id === work.id ? { ...w, isPublic: newValue } : w);
        return updated.sort((a, b) => {
          const aP = a.isPublic !== false;
          const bP = b.isPublic !== false;
          if (aP && !bP) return -1;
          if (!aP && bP) return 1;
          const aOrder = a.publicOrder !== undefined ? a.publicOrder : 999;
          const bOrder = b.publicOrder !== undefined ? b.publicOrder : 999;
          if (aP && bP) return aOrder - bOrder;
          return 0;
        });
      });
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  }

  async function setHero(work) {
    if (work.isFeatured) return;
    setSaving(work.id);
    try {
      await Promise.all(artworks.map(w =>
        updateDoc(doc(db, 'artists', userId, 'artworks', w.id), { isFeatured: w.id === work.id })
      ));
      setArtworks(prev => prev.map(w => ({ ...w, isFeatured: w.id === work.id })));
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  }

  async function moveWork(work, dir) {
    const pub = artworks.filter(w => w.isPublic !== false);
    const idx = pub.findIndex(w => w.id === work.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= pub.length) return;
    const reordered = [...pub];
    const tmp = reordered[idx];
    reordered[idx] = reordered[newIdx];
    reordered[newIdx] = tmp;
    setSaving(work.id);
    try {
      await Promise.all(reordered.map((w, i) =>
        updateDoc(doc(db, 'artists', userId, 'artworks', w.id), { publicOrder: i })
      ));
      const updated = reordered.map((w, i) => ({ ...w, publicOrder: i }));
      setArtworks([...updated, ...artworks.filter(w => w.isPublic === false)]);
    } catch (err) { console.error(err); }
    finally { setSaving(null); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-3 w-full max-w-xl px-6 animate-pulse">
          <div className="h-16 bg-card rounded-2xl" />
          <div className="h-16 bg-card rounded-2xl" />
          <div className="h-16 bg-card rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        <div className="flex items-start justify-between mb-10">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Your Folio</div>
            <h1 className="text-2xl font-bold mb-1" style={{fontFamily:'var(--font-playfair)'}}>Public presence</h1>
            <p className="text-secondary text-sm leading-relaxed max-w-sm">
              Choose what the world sees. Set your hero image. Control the order.
            </p>
          </div>
          {username && (
            
              href={'/artist/' + username}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border border-default hover:border-purple-700 text-secondary hover:text-primary text-xs rounded-xl transition-all"
            >
              View Folio
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-purple-400 uppercase tracking-widest">On your Folio</div>
            <div className="text-xs text-muted">{publicWorks.length} {publicWorks.length === 1 ? 'work' : 'works'}</div>
          </div>

          {publicWorks.length === 0 && (
            <div className="bg-card border border-default rounded-2xl p-8 text-center">
              <div className="text-secondary text-sm mb-1">Nothing on your Folio yet.</div>
              <div className="text-muted text-xs">Add works from the list below.</div>
            </div>
          )}

          <div className="space-y-2">
            {publicWorks.map((work, idx) => (
              <div key={work.id} className={'flex items-center gap-3 bg-card border rounded-2xl p-3 transition-all ' + (work.isFeatured ? 'border-yellow-800/60' : 'border-default')}>
                {work.imageUrl
                  ? <img src={work.imageUrl} alt={work.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  : <div className="w-12 h-12 rounded-xl bg-card-hover flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-primary truncate">{work.title || 'Untitled'}</div>
                    {work.isFeatured && (
                      <span className="text-xs text-yellow-600 bg-yellow-900/20 border border-yellow-800/40 px-2 py-0.5 rounded-full flex-shrink-0">Hero</span>
                    )}
                  </div>
                  <div className="text-xs text-secondary">{[work.year, work.medium].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => setHero(work)}
                    disabled={saving !== null}
                    title={work.isFeatured ? 'Hero image' : 'Set as hero image'}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-card-hover transition-all"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24"
                      fill={work.isFeatured ? '#C4A35A' : 'none'}
                      stroke={work.isFeatured ? '#C4A35A' : '#504840'}
                      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => moveWork(work, -1)}
                    disabled={idx === 0 || saving !== null}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-card-hover transition-all disabled:opacity-20"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                      <polyline points="18 15 12 9 6 15"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => moveWork(work, 1)}
                    disabled={idx === publicWorks.length - 1 || saving !== null}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-card-hover transition-all disabled:opacity-20"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => togglePublic(work)}
                    disabled={saving !== null}
                    title="Remove from Folio"
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-900/20 transition-all"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#504840" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {privateWorks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-muted uppercase tracking-widest">Not on Folio</div>
              <div className="text-xs text-muted">{privateWorks.length} {privateWorks.length === 1 ? 'work' : 'works'}</div>
            </div>
            <div className="space-y-2">
              {privateWorks.map(work => (
                <div key={work.id} className="flex items-center gap-3 bg-card border border-default rounded-2xl p-3 opacity-50 hover:opacity-100 transition-all">
                  {work.imageUrl
                    ? <img src={work.imageUrl} alt={work.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-xl bg-card-hover flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-primary truncate">{work.title || 'Untitled'}</div>
                    <div className="text-xs text-secondary">{[work.year, work.medium].filter(Boolean).join(' · ')}</div>
                  </div>
                  <button
                    onClick={() => togglePublic(work)}
                    disabled={saving !== null}
                    className="flex items-center gap-1.5 px-3 py-2 border border-default hover:border-purple-700 hover:text-primary text-secondary text-xs rounded-xl transition-all flex-shrink-0"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add to Folio
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {artworks.length === 0 && (
          <div className="text-center py-24">
            <div className="text-secondary text-sm mb-6">No works in your archive yet.</div>
            <button onClick={() => router.push('/upload')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">
              Add your first work
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
