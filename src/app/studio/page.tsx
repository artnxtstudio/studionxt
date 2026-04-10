'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Studio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [miraGreeting, setMiraGreeting] = useState('');
  const [miraOpen, setMiraOpen] = useState<string | null>(null);
  const [miraTexts, setMiraTexts] = useState<Record<string, string>>({});
  const [miraLoading, setMiraLoading] = useState<string | null>(null);
  const [counts, setCounts] = useState({ works: 0, wip: 0, voices: 0 });
  const [artistName, setArtistName] = useState('');
  const [years, setYears] = useState<string[]>([]);
  const [mediums, setMediums] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<{type: 'year'|'medium', value: string} | null>(null);
  const [toast, setToast] = useState('');

  // Show success toast when redirected from upload with ?saved=1
  useEffect(() => {
    if (searchParams.get('saved') === '1') {
      setToast('Work saved to archive.');
      // Clean the URL without a page reload
      window.history.replaceState({}, '', '/studio');
      const t = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      const uid = user.uid;
      setArtistName(user.displayName?.split(' ')[0] || '');

      try {
        const [worksSnap, wipSnap, voicesSnap] = await Promise.all([
          getDocs(collection(db, 'artists', uid, 'artworks')),
          getDocs(collection(db, 'artists', uid, 'wip')),
          getDocs(collection(db, 'artists', uid, 'voices')),
        ]);

        const works: any[] = worksSnap.docs.map(d => ({ id: d.id, type: 'work', ...d.data() }));
        const wips: any[]  = wipSnap.docs.map(d => ({ id: d.id, type: 'wip',  ...d.data() }));
        const voices: any[] = voicesSnap.docs.map(d => ({ id: d.id, type: 'voice', ...d.data() }));

        setCounts({ works: works.length, wip: wips.length, voices: voices.length });

        const uniqueYears = Array.from(new Set(
          works.map((w: any) => w.year).filter((y: any) => y && y.trim() !== '')
        )).sort((a: any, b: any) => b - a) as string[];

        const uniqueMediums = Array.from(new Set(
          works.map((w: any) => w.medium).filter((m: any) => m && m.trim() !== '')
        )) as string[];

        setYears(uniqueYears);
        setMediums(uniqueMediums);

        const all = [...works, ...wips, ...voices].sort((a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setFeed(all);

        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        setMiraGreeting(timeGreeting);
      } catch (err) {
        console.error('Wall load error:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function askMira(item: any) {
    if (miraOpen === item.id) { setMiraOpen(null); return; }
    setMiraOpen(item.id);
    if (miraTexts[item.id]) return;
    setMiraLoading(item.id);
    try {
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': auth.currentUser?.uid || '' },
        body: JSON.stringify({
          query: `Look at this artwork: "${item.title || 'Untitled'}", ${item.year || ''}, ${item.medium || ''}. Write one compelling observation in 2 sentences that makes the artist see it differently.`,
          artistContext: { artwork: item },
        }),
      });
      const data = await res.json();
      setMiraTexts(t => ({ ...t, [item.id]: data.response || 'Something worth sitting with.' }));
    } catch {
      setMiraTexts(t => ({ ...t, [item.id]: 'Something worth sitting with.' }));
    } finally {
      setMiraLoading(null);
    }
  }

  const statusColor: Record<string, string> = {
    Available:      'text-purple-400',
    Sold:           'text-green-400',
    Consigned:      'text-yellow-400',
    'Not for sale': 'text-secondary',
  };

  function getItemImage(item: any) {
    if (item.type === 'work') return item.imageUrl;
    if (item.type === 'wip') return item.timeline?.length > 0 ? item.timeline[item.timeline.length - 1].imageUrl : null;
    return null;
  }

  function getItemLabel(item: any) {
    if (item.type === 'work')  return 'Artwork';
    if (item.type === 'wip')   return 'In Progress';
    if (item.type === 'voice') return 'Voice';
    return '';
  }

  function getItemRoute(item: any) {
    if (item.type === 'work')  return '/artwork?id=' + item.id;
    if (item.type === 'wip')   return '/archive/wip/' + item.id;
    if (item.type === 'voice') return '/archive/voices/' + item.id;
    return '/archive';
  }

  function getItemSub(item: any) {
    if (item.type === 'work')  return [item.year, item.medium].filter(Boolean).join(' · ');
    if (item.type === 'wip')   return (item.status || 'Active') + (item.timeline ? ' · ' + item.timeline.length + ' photos' : '');
    if (item.type === 'voice') return (item.mode === 'guided' ? 'Guided' : 'Free') + (item.topic ? ' · ' + item.topic : '');
    return '';
  }

  // SVG avatars — no emoji
  function ItemAvatar({ item }: { item: any }) {
    if (item.type === 'voice') {
      return (
        <div className="w-9 h-9 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
            <path d="M19 10v2a7 7 0 01-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </div>
      );
    }
    const bg = item.type === 'wip' ? 'bg-green-800' : 'bg-purple-800';
    return (
      <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center flex-shrink-0 text-xs font-bold text-white`}>
        {(item.title || 'U')[0].toUpperCase()}
      </div>
    );
  }

  // SVG placeholder — no emoji
  function ImagePlaceholder({ type }: { type: string }) {
    return (
      <div className="w-full h-64 bg-card flex items-center justify-center">
        {type === 'wip' ? (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2E2820" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h4l2-4 2 8 2-4h2"/>
          </svg>
        ) : (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2E2820" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">
          <div className="bg-card rounded-2xl p-5 animate-pulse">
            <div className="h-3 bg-card-hover rounded w-48 mb-3" />
            <div className="h-3 bg-card-hover rounded w-64" />
          </div>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl overflow-hidden animate-pulse">
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-card-hover" />
                <div className="h-3 bg-card-hover rounded w-32" />
              </div>
              <div className="w-full h-72 bg-card-hover" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-card-hover rounded w-48" />
                <div className="h-3 bg-card-hover rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredFeed = feed.filter(item =>
    !activeFilter ||
    (activeFilter.type === 'year'   ? item.year   === activeFilter.value
                                    : item.medium === activeFilter.value)
  );

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-8">

      {/* ── Success toast ──────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#171410] border border-green-800 text-green-400 text-sm px-5 py-3 rounded-2xl shadow-xl animate-fade-in">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}

      <div className="max-w-lg mx-auto">

        {/* ── Mobile header ──────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-[#221A12] sm:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px 8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-playfair)', letterSpacing: '0.01em' }}>Wall</span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{counts.works} {counts.works === 1 ? 'work' : 'works'} · {counts.wip} WIP · {counts.voices} {counts.voices === 1 ? 'voice' : 'voices'}</span>
          </div>
        </div>

        {/* ── Mira greeting card ─────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-card border border-default rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {miraGreeting}{artistName ? `, ${artistName}.` : '.'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Your archive has {counts.works} {counts.works === 1 ? 'work' : 'works'}.
                </div>
              </div>
              <button
                onClick={() => router.push('/mira')}
                style={{ flexShrink: 0, background: '#7e22ce', border: 'none', borderRadius: '999px', padding: '9px 18px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Talk to Mira
              </button>
            </div>
          </div>
        </div>

        {/* ── Filter chips ───────────────────────────────────────────── */}
        {(years.length > 0 || mediums.length > 0) && (
          <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {activeFilter !== null && (
              <button
                onClick={() => setActiveFilter(null)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-all border-default text-secondary hover:border-purple-700 hover:text-purple-400"
                title="Clear filter"
              >
                ✕ Clear
              </button>
            )}
            {years.map(y => (
              <button key={'year-' + y}
                onClick={() => setActiveFilter(activeFilter?.value === y ? null : { type: 'year', value: y })}
                className={'flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-all ' + (activeFilter?.value === y ? 'bg-purple-700 border-purple-700 text-white' : 'border-default text-secondary hover:border-purple-700 hover:text-purple-400')}
              >{y}</button>
            ))}
            {mediums.map(m => (
              <button key={'medium-' + m}
                onClick={() => setActiveFilter(activeFilter?.value === m ? null : { type: 'medium', value: m })}
                className={'flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-all ' + (activeFilter?.value === m ? 'bg-purple-700 border-purple-700 text-white' : 'border-default text-secondary hover:border-purple-700 hover:text-purple-400')}
              >{m}</button>
            ))}
          </div>
        )}

        {/* ── Empty state ────────────────────────────────────────────── */}
        {feed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <div className="w-16 h-16 rounded-2xl bg-card border border-default flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div className="text-primary font-semibold text-xl mb-3 text-center" style={{ fontFamily: 'var(--font-playfair)' }}>Your wall is empty</div>
            <div className="text-secondary text-sm text-center max-w-xs mb-8 leading-relaxed">Add your first artwork, start tracking a work in progress, or record a voice session with Mira.</div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button onClick={() => router.push('/upload')} className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">Add first artwork</button>
              <button onClick={() => router.push('/archive/wip/new')} className="w-full py-3 bg-card border border-default hover:border-purple-700 text-primary text-sm rounded-xl transition-all">Track a work in progress</button>
              <button onClick={() => router.push('/archive/voices/new')} className="w-full py-3 bg-card border border-default hover:border-purple-700 text-primary text-sm rounded-xl transition-all">Start a voice session</button>
            </div>
          </div>
        )}

        {/* ── Feed ───────────────────────────────────────────────────── */}
        <div className="divide-y divide-[#111] mt-2">
          {filteredFeed.map(item => {
            const image = getItemImage(item);
            const route = getItemRoute(item);

            return (
              <div key={item.type + item.id} className="bg-background">

                {/* Row header */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ItemAvatar item={item} />
                    <div>
                      <div className="text-sm font-semibold text-primary leading-tight">{item.title || 'Untitled'}</div>
                      <div className="text-xs text-secondary">{getItemSub(item)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + (item.type === 'work' ? 'border-purple-800 text-purple-400' : item.type === 'wip' ? 'border-green-800 text-green-400' : 'border-blue-800 text-blue-400')}>
                      {getItemLabel(item)}
                    </span>
                    <button onClick={() => router.push(route)} className="text-secondary hover:text-primary transition-colors p-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Voice card */}
                {item.type === 'voice' && (
                  <div onClick={() => router.push(route)} className="mx-4 mb-3 bg-card border border-default rounded-2xl p-5 cursor-pointer hover:border-purple-900 transition-all">
                    <div className="text-xs text-blue-400 mb-2">{item.mode === 'guided' ? 'Guided session' : 'Free session'}{item.topic ? ' · ' + item.topic : ''}</div>
                    {item.summary
                      ? <div className="text-sm text-primary leading-relaxed line-clamp-3 italic">"{item.summary}"</div>
                      : <div className="text-sm text-secondary">No summary yet.</div>
                    }
                    {item.audioUrl && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-blue-400">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                          <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                        </svg>
                        Audio recorded
                      </div>
                    )}
                    <div className="text-xs text-muted mt-2">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                    </div>
                  </div>
                )}

                {/* Artwork / WIP image */}
                {item.type !== 'voice' && (
                  <div onClick={() => router.push(route)} className="cursor-pointer relative">
                    {image
                      ? <img src={image} alt={item.title} className="w-full object-contain max-h-[480px] bg-card" />
                      : <ImagePlaceholder type={item.type} />
                    }
                    {item.type === 'wip' && item.timeline?.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-1 text-xs text-primary">
                        {item.timeline.length} photos
                      </div>
                    )}
                  </div>
                )}

                {/* Ask Mira + status */}
                {item.type !== 'voice' && (
                  <>
                    <div className="px-4 pt-3 pb-1 flex items-center gap-4">
                      <button
                        onClick={() => askMira(item)}
                        className={'flex items-center gap-1.5 text-xs transition-colors ' + (miraOpen === item.id ? 'text-purple-400' : 'text-secondary hover:text-purple-400')}
                      >
                        <div className="w-7 h-7 rounded-full bg-card-hover border border-default flex items-center justify-center text-xs font-bold text-purple-400">M</div>
                        Ask Mira
                      </button>
                      <button onClick={() => router.push(route)} className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors ml-auto">
                        View →
                      </button>
                    </div>

                    {miraOpen === item.id && (
                      <div className="mx-4 mb-3 mt-1 bg-card border border-default rounded-xl p-3">
                        <div className="text-xs text-purple-400 mb-1.5">Mira</div>
                        {miraLoading === item.id ? (
                          <div className="flex gap-1 py-1">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        ) : (
                          <div className="text-primary text-sm leading-relaxed">{miraTexts[item.id]}</div>
                        )}
                      </div>
                    )}

                    <div className="px-4 pb-3">
                      {item.type === 'work' && item.status && (
                        <span className={'text-xs font-medium ' + (statusColor[item.status] || 'text-secondary')}>{item.status}</span>
                      )}
                      {item.type === 'work' && item.dimensions && (
                        <span className="text-xs text-muted ml-2">{item.dimensions}</span>
                      )}
                      {item.type === 'wip' && item.problem && (
                        <div className="text-xs text-secondary line-clamp-2">{item.problem}</div>
                      )}
                    </div>
                  </>
                )}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
