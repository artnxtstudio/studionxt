'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function publicWorkFields(w: any) {
  return {
    id: w.id,
    imageUrl: w.imageUrl || '',
    title: w.title || '',
    year: w.year || '',
    medium: w.medium || '',
    dimensions: w.dimensions || '',
    series: w.series || [],
    isFeatured: w.isFeatured || false,
    publicOrder: w.publicOrder ?? 999,
    createdAt: w.createdAt || '',
  };
}

export default function Folio() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [artworks, setArtworks] = useState([]);
  const [saving, setSaving] = useState('');
  const [arranging, setArranging] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      const uid = user.uid;
      setUserId(uid);
      try {
        const artistDoc = await getDoc(doc(db, 'artists', uid));
        const uname = artistDoc.exists() ? (artistDoc.data().username || '') : '';
        if (uname) setUsername(uname);
        const snap = await getDocs(collection(db, 'artists', uid, 'artworks'));
        const works = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sync all currently-public works to the public subcollection
        if (uname) {
          await Promise.all(works.map(w =>
            w.isPublic !== false
              ? setDoc(doc(db, 'public', uname, 'works', w.id), publicWorkFields(w), { merge: true })
              : deleteDoc(doc(db, 'public', uname, 'works', w.id)).catch(() => {})
          ));
        }
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
      // Sync to public subcollection so unauthenticated visitors can see it
      if (username) {
        if (newValue) {
          await setDoc(doc(db, 'public', username, 'works', work.id), publicWorkFields({ ...work, isPublic: newValue }));
        } else {
          await deleteDoc(doc(db, 'public', username, 'works', work.id)).catch(() => {});
        }
      }
      setArtworks(prev => {
        const updated = prev.map(w => w.id === work.id ? { ...w, isPublic: newValue } : w);
        return updated.sort((a, b) => {
          const aP = a.isPublic !== false;
          const bP = b.isPublic !== false;
          if (aP && !bP) return -1;
          if (!aP && bP) return 1;
          const aO = a.publicOrder !== undefined ? a.publicOrder : 999;
          const bO = b.publicOrder !== undefined ? b.publicOrder : 999;
          if (aP && bP) return aO - bO;
          return 0;
        });
      });
    } catch (err) { console.error(err); }
    finally { setSaving(''); }
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
    finally { setSaving(''); }
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
    finally { setSaving(''); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-4xl px-6 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden">
              <div className="h-40 bg-card-hover" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-card-hover rounded w-3/4" />
                <div className="h-3 bg-card-hover rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary pb-24">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Your Folio</div>
            <h1 className="text-2xl font-bold mb-1" style={{fontFamily:'var(--font-playfair)'}}>Public presence</h1>
            <p className="text-secondary text-sm leading-relaxed max-w-sm">
              Tap the dot to show or hide a work. Set the hero image. Use Arrange to reorder.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {publicWorks.length > 1 && (
              <button
                onClick={() => setArranging(a => !a)}
                className={'px-4 py-2 text-xs rounded-xl border transition-all ' + (arranging ? 'bg-purple-700 border-purple-700 text-white' : 'border-purple-700 text-purple-400 hover:bg-purple-700 hover:text-white')}
              >
                {arranging ? 'Done' : 'Arrange'}
              </button>
            )}
            {username && (
              <a href={'/artist/' + username} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 border border-default hover:border-purple-700 text-secondary hover:text-primary text-xs rounded-xl transition-all">
                View
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {artworks.length === 0 && (
          <div className="text-center py-24">
            <div className="text-secondary text-sm mb-6">No works in your archive yet.</div>
            <button onClick={() => router.push('/upload')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">
              Add your first work
            </button>
          </div>
        )}

        {artworks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {artworks.map((work, idx) => {
              const isPublic = work.isPublic !== false;
              const pubIdx = publicWorks.findIndex(w => w.id === work.id);

              return (
                <div key={work.id}
                  className={'bg-card border rounded-xl overflow-hidden transition-all ' + (isPublic ? 'border-default' : 'border-default opacity-50 hover:opacity-80')}>

                  {/* Image area */}
                  <div className="relative cursor-pointer" onClick={() => !arranging && router.push('/artwork?id=' + work.id)}>
                    {work.imageUrl
                      ? <img src={work.imageUrl} alt={work.title} className="w-full h-36 sm:h-44 object-cover" />
                      : <div className="w-full h-36 sm:h-44 bg-card-hover flex items-center justify-center">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2E2820" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                        </div>
                    }

                    {/* Hero badge */}
                    {work.isFeatured && isPublic && (
                      <div className="absolute bottom-2 left-2 text-xs font-medium px-2 py-0.5 rounded"
                        style={{background:'rgba(196,163,90,0.9)', color:'#fff', fontSize:'9px', letterSpacing:'0.08em', textTransform:'uppercase'}}>
                        Hero
                      </div>
                    )}

                    {/* Public toggle dot */}
                    <button
                      onClick={e => { e.stopPropagation(); togglePublic(work); }}
                      disabled={saving !== ''}
                      title={isPublic ? 'Remove from Folio' : 'Add to Folio'}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
                      style={{background: isPublic ? '#7e22ce' : 'rgba(0,0,0,0.4)'}}
                    >
                      {isPublic ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <div className="text-xs font-semibold text-primary truncate mb-0.5">{work.title || 'Untitled'}</div>
                    <div className="text-xs text-secondary truncate">{[work.year, work.medium].filter(Boolean).join(' · ')}</div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-2.5">

                      {/* Set hero — only if public */}
                      {isPublic && !arranging && (
                        <button
                          onClick={() => setHero(work)}
                          disabled={saving !== '' || work.isFeatured}
                          title={work.isFeatured ? 'Hero image' : 'Set as hero'}
                          className="flex items-center gap-1 text-xs transition-all disabled:opacity-40"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24"
                            fill={work.isFeatured ? '#C4A35A' : 'none'}
                            stroke={work.isFeatured ? '#C4A35A' : '#504840'}
                            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          <span className="text-muted" style={{fontSize:'10px'}}>{work.isFeatured ? 'Hero' : 'Set hero'}</span>
                        </button>
                      )}

                      {/* Arrange arrows — only in arrange mode for public works */}
                      {isPublic && arranging && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveWork(work, -1)}
                            disabled={pubIdx === 0 || saving !== ''}
                            className="w-6 h-6 rounded flex items-center justify-center bg-card-hover hover:bg-purple-900/30 transition-all disabled:opacity-20"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                              <polyline points="15 18 9 12 15 6"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => moveWork(work, 1)}
                            disabled={pubIdx === publicWorks.length - 1 || saving !== ''}
                            className="w-6 h-6 rounded flex items-center justify-center bg-card-hover hover:bg-purple-900/30 transition-all disabled:opacity-20"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </button>
                          {isPublic && (
                            <span className="text-xs text-muted ml-1 self-center" style={{fontSize:'10px'}}>
                              #{pubIdx + 1}
                            </span>
                          )}
                        </div>
                      )}

                      {!isPublic && (
                        <span className="text-xs text-muted" style={{fontSize:'10px'}}>Not on Folio</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
