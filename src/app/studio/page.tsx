'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Studio() {
  const router = useRouter();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [miraGreeting, setMiraGreeting] = useState('');
  const [miraQuestion, setMiraQuestion] = useState('');
  const [miraLoaded, setMiraLoaded] = useState(false);
  const [miraOpen, setMiraOpen] = useState<string | null>(null);
  const [miraTexts, setMiraTexts] = useState<Record<string, string>>({});
  const [miraLoading, setMiraLoading] = useState<string | null>(null);
  const [counts, setCounts] = useState({ works: 0, wip: 0, voices: 0 });
  const [years, setYears] = useState<string[]>([]);
  const [mediums, setMediums] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<{type: 'year'|'medium', value: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || '';
      try {
        const [worksSnap, wipSnap, voicesSnap] = await Promise.all([
          getDocs(collection(db, 'artists', uid, 'artworks')),
          getDocs(collection(db, 'artists', uid, 'wip')),
          getDocs(collection(db, 'artists', uid, 'voices')),
        ]);

        const works: any[] = worksSnap.docs.map(d => ({ id: d.id, type: 'work', ...d.data() }));
        const wips: any[] = wipSnap.docs.map(d => ({ id: d.id, type: 'wip', ...d.data() }));
        const voices: any[] = voicesSnap.docs.map(d => ({ id: d.id, type: 'voice', ...d.data() }));

        setCounts({ works: works.length, wip: wips.length, voices: voices.length });

        // Extract unique years and mediums
        const uniqueYears = Array.from(new Set(
          works.map((w: any) => w.year).filter((y: any) => y && y.trim() !== '')
        )).sort((a: any, b: any) => b - a) as string[];
        const uniqueMediums = Array.from(new Set(
          works.map((w: any) => w.medium).filter((m: any) => m && m.trim() !== '')
        )) as string[];
        setYears(uniqueYears);
        setMediums(uniqueMediums);

        const all = [...works, ...wips, ...voices].sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        setFeed(all);

        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const totalWorks = works.length;
        const lastWork = all[0];
        const daysSince = lastWork?.createdAt
          ? Math.floor((Date.now() - new Date(lastWork.createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        let greeting = timeGreeting + '.';
        if (totalWorks === 0) {
          greeting += ' Your studio is ready. Add your first work.';
        } else if (daysSince === 0) {
          greeting += ' You added something today. The studio is alive.';
        } else if (daysSince === 1) {
          greeting += ' You have ' + totalWorks + ' works archived.';
        } else if (daysSince && daysSince > 7) {
          greeting += ' It has been ' + daysSince + ' days since your last entry.';
        } else {
          greeting += ' You have ' + totalWorks + ' ' + (totalWorks === 1 ? 'work' : 'works') + ' archived.';
        }
        setMiraGreeting(greeting);

        try {
          const res = await fetch('/api/mira', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-uid': auth.currentUser?.uid || '' },
            body: JSON.stringify({
              query: 'You are greeting an artist at the start of their session. They have ' + totalWorks + ' works archived, ' + wips.length + ' works in progress, and ' + voices.length + ' voice sessions. ' + (daysSince && daysSince > 7 ? 'They have not added anything in ' + daysSince + ' days.' : 'They were recently active.') + ' Ask them one warm, specific question about their practice today. One sentence only. No preamble.',
              artistContext: {},
            }),
          });
          const data = await res.json();
          setMiraQuestion(data.response || 'What are you working on today?');
        } catch {
          setMiraQuestion('What are you working on today?');
        }
        setMiraLoaded(true);

      } catch (err) {
        console.error(err);
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
          query: 'Look at this artwork: "' + (item.title || 'Untitled') + '", ' + (item.year || '') + ', ' + (item.medium || '') + '. Write one compelling observation in 2 sentences that makes the artist see it differently.',
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
    Available: 'text-purple-400',
    Sold: 'text-green-400',
    Consigned: 'text-yellow-400',
    'Not for sale': 'text-secondary',
  };

  const wipStatusColor: Record<string, string> = {
    Active: 'text-green-400',
    Paused: 'text-yellow-400',
    Abandoned: 'text-red-500',
  };

  function getItemImage(item: any) {
    if (item.type === 'work') return item.imageUrl;
    if (item.type === 'wip') return item.timeline && item.timeline.length > 0 ? item.timeline[item.timeline.length - 1].imageUrl : null;
    return null;
  }

  function getItemLabel(item: any) {
    if (item.type === 'work') return 'Artwork';
    if (item.type === 'wip') return 'In Progress';
    if (item.type === 'voice') return 'Voice Session';
    return '';
  }

  function getItemRoute(item: any) {
    if (item.type === 'work') return '/artwork?id=' + item.id;
    if (item.type === 'wip') return '/archive/wip/' + item.id;
    if (item.type === 'voice') return '/archive/voices/' + item.id;
    return '/archive';
  }

  function getItemSub(item: any) {
    if (item.type === 'work') return [item.year, item.medium].filter(Boolean).join(' · ');
    if (item.type === 'wip') return (item.status || 'Active') + (item.timeline ? ' · ' + item.timeline.length + ' photos' : '');
    if (item.type === 'voice') return (item.mode === 'guided' ? 'Guided' : 'Free') + (item.topic ? ' · ' + item.topic : '');
    return '';
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

  return (
    <div className="min-h-screen bg-background pb-24 sm:pb-8">
      <div className="max-w-lg mx-auto">

        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-[#221A12] px-4 py-3 flex justify-between items-center sm:hidden">
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "#2E2820", border: "none", cursor: "pointer", color: "#F0EBE3", borderRadius: "50%" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <style>{`@keyframes pulse-logo { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(0.92); } }`}</style>
          <button
            onClick={() => router.push('/mira')}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
          >
            <img
              src="https://firebasestorage.googleapis.com/v0/b/studionxt-2657b.firebasestorage.app/o/artnxt.png?alt=media&token=991c5ea4-8d04-48ae-b82d-67d6f5900890"
              alt="StudioNXT — Talk to Mira"
              style={{ width: "40px", height: "40px", animation: "pulse-logo 3s ease-in-out infinite" }}
            />
          </button>
          <div style={{ width: "36px" }} />
        </div>

        <div className="px-4 pt-4 pb-2">
          <div className="bg-card border border-default rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-purple-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">M</div>
              <div className="flex-1">
                {miraLoaded ? (
                  <>
                    <div className="text-sm text-primary leading-relaxed mb-2">{miraGreeting}</div>
                    <div className="text-sm text-purple-500 leading-relaxed italic dark:text-purple-300">{miraQuestion}</div>
                  </>
                ) : (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-3 bg-card-hover rounded w-3/4" />
                    <div className="h-3 bg-card-hover rounded w-1/2" />
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/mira')}
              className="mt-4 text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Talk to Mira →
            </button>
          </div>
        </div>

        {(years.length > 0 || mediums.length > 0) && (
          <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveFilter(null)}
              className={"flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-all " + (activeFilter === null ? "bg-purple-700 border-purple-700 text-white" : "border-default text-secondary hover:border-purple-700 hover:text-purple-400")}
            >
              All
            </button>
            {years.map((y) => (
              <button
                key={'year-' + y}
                onClick={() => setActiveFilter(activeFilter?.value === y ? null : {type: 'year', value: y})}
                className={"flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-all " + (activeFilter?.value === y ? "bg-purple-700 border-purple-700 text-white" : "border-default text-secondary hover:border-purple-700 hover:text-purple-400")}
              >
                {y}
              </button>
            ))}
            {mediums.map((m) => (
              <button
                key={'medium-' + m}
                onClick={() => setActiveFilter(activeFilter?.value === m ? null : {type: 'medium', value: m})}
                className={"flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-all " + (activeFilter?.value === m ? "bg-purple-700 border-purple-700 text-white" : "border-default text-secondary hover:border-purple-700 hover:text-purple-400")}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {feed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 px-8">
            <div className="w-16 h-16 rounded-2xl bg-card border border-default flex items-center justify-center mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <div className="text-primary font-semibold text-xl mb-3 text-center" style={{fontFamily:"var(--font-playfair)"}}>Your wall is empty</div>
            <div className="text-secondary text-sm text-center max-w-xs mb-8 leading-relaxed">Add your first artwork, start tracking a work in progress, or record a voice session with Mira.</div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button onClick={() => router.push('/upload')} className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">
                Add first artwork
              </button>
              <button onClick={() => router.push('/archive/wip/new')} className="w-full py-3 bg-card border border-default hover:border-purple-700 text-primary text-sm rounded-xl transition-all">
                Track a work in progress
              </button>
              <button onClick={() => router.push('/archive/voices/new')} className="w-full py-3 bg-card border border-default hover:border-purple-700 text-primary text-sm rounded-xl transition-all">
                Start a voice session
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-[#111] mt-2">
          {feed.filter(item => !activeFilter || (activeFilter.type === 'year' ? item.year === activeFilter.value : item.medium === activeFilter.value)).map((item) => {
            const image = getItemImage(item);
            const route = getItemRoute(item);
            const label = getItemLabel(item);
            const sub = getItemSub(item);
            const initial = (item.title || 'U')[0].toUpperCase();

            return (
              <div key={item.type + item.id} className="bg-background">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ' + (item.type === 'work' ? 'bg-purple-700 text-white' : item.type === 'wip' ? 'bg-green-700 text-white' : 'bg-blue-700 text-white')}>
                      {item.type === 'voice' ? '🎙' : initial}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-primary leading-tight">{item.title || 'Untitled'}</div>
                      <div className="text-xs text-secondary">{sub}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={'text-xs px-2 py-0.5 rounded-full border ' + (item.type === 'work' ? 'border-purple-400 text-purple-600' : item.type === 'wip' ? 'border-green-400 text-green-600' : 'border-blue-400 text-blue-600')}>
                      {label}
                    </span>
                    <button onClick={() => router.push(route + (item.type === 'work' ? '&edit=true' : ''))} className="text-secondary hover:text-primary transition-colors p-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {item.type === 'voice' ? (
                  <div
                    onClick={() => router.push(route)}
                    className="mx-4 mb-3 bg-card border border-default rounded-2xl p-5 cursor-pointer hover:border-purple-900 transition-all"
                  >
                    <div className="text-xs text-blue-400 mb-2">{item.mode === 'guided' ? 'Guided session' : 'Free session'} · {item.topic || 'General practice'}</div>
                    {item.summary ? (
                      <div className="text-sm text-primary leading-relaxed line-clamp-3 italic">"{item.summary}"</div>
                    ) : (
                      <div className="text-sm text-secondary">No summary yet.</div>
                    )}
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
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                    </div>
                  </div>
                ) : (
                  <div onClick={() => router.push(route)} className="cursor-pointer bg-card relative">
                    {image ? (
                      <img src={image} alt={item.title} className="w-full object-contain max-h-[480px] bg-card" />
                    ) : (
                      <div className="w-full h-64 bg-card flex items-center justify-center">
                        <span className="text-5xl opacity-10">{item.type === 'wip' ? '🎨' : '🖼'}</span>
                      </div>
                    )}
                    {item.type === 'wip' && item.timeline && item.timeline.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg px-2 py-1 text-xs text-primary">
                        {item.timeline.length} photos
                      </div>
                    )}
                  </div>
                )}

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
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
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
                      {item.carolQuote && (
                        <div className="text-secondary text-sm mt-2 italic">"{item.carolQuote}"</div>
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
