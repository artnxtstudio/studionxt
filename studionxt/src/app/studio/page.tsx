'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function Studio() {
  const router = useRouter();
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [miraOpen, setMiraOpen] = useState<string | null>(null);
  const [miraTexts, setMiraTexts] = useState<Record<string, string>>({});
  const [miraLoading, setMiraLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || 'demo-user';
      try {
        const snap = await getDocs(collection(db, 'artists', uid, 'artworks'));
        const works = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        works.sort((a: any, b: any) => parseInt(b.year || '0') - parseInt(a.year || '0'));
        setArtworks(works);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function askMira(work: any) {
    if (miraOpen === work.id) { setMiraOpen(null); return; }
    setMiraOpen(work.id);
    if (miraTexts[work.id]) return;
    setMiraLoading(work.id);
    try {
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Look at this artwork: "' + (work.title || 'Untitled') + '", ' + (work.year || '') + ', ' + (work.medium || '') + '. Write one compelling observation in 2 sentences that makes the artist see it differently.',
          artistContext: { artwork: work },
        }),
      });
      const data = await res.json();
      setMiraTexts(t => ({ ...t, [work.id]: data.response || 'Something worth sitting with.' }));
    } catch {
      setMiraTexts(t => ({ ...t, [work.id]: 'Something worth sitting with.' }));
    } finally {
      setMiraLoading(null);
    }
  }

  const statusColor: Record<string, string> = {
    Available: 'text-purple-400',
    Sold: 'text-green-400',
    Consigned: 'text-yellow-400',
    'Not for sale': 'text-gray-500',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#111] rounded-2xl overflow-hidden animate-pulse">
              <div className="flex items-center gap-3 p-4">
                <div className="w-8 h-8 rounded-full bg-[#222]"></div>
                <div className="h-3 bg-[#222] rounded w-32"></div>
              </div>
              <div className="w-full h-80 bg-[#1a1a1a]"></div>
              <div className="p-4 space-y-2">
                <div className="h-3 bg-[#222] rounded w-48"></div>
                <div className="h-3 bg-[#222] rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🎨</div>
          <div className="text-white font-medium mb-2">Your studio is empty</div>
          <div className="text-gray-500 text-sm mb-8">Add your first artwork to see it here</div>
          <button onClick={() => router.push('/upload')} className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl transition-all">
            Add first artwork
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] pb-24 sm:pb-8">
      <div className="max-w-lg mx-auto">

        <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#111] px-4 py-3 flex justify-between items-center">
          <span className="text-white font-bold text-lg tracking-tight">Studio</span>
          <button
            onClick={() => router.push('/upload')}
            className="w-8 h-8 flex items-center justify-center text-white hover:text-purple-400 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
          </button>
        </div>

        <div className="divide-y divide-[#111]">
          {artworks.map((work) => (
            <div key={work.id} className="bg-[#0A0A0A]">

              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center text-xs font-bold text-white">
                    {(work.title || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white leading-tight">{work.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500">{[work.year, work.medium].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/artwork?id=' + work.id + '&edit=true')}
                  className="text-gray-500 hover:text-white transition-colors p-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>
              </div>

              <div
                onClick={() => router.push('/artwork?id=' + work.id)}
                className="cursor-pointer bg-[#111] relative"
              >
                {work.imageUrl ? (
                  <img
                    src={work.imageUrl}
                    alt={work.title}
                    className="w-full object-contain max-h-[480px] bg-[#111]"
                  />
                ) : (
                  <div className="w-full h-72 bg-[#111] flex items-center justify-center">
                    <span className="text-5xl opacity-20">🖼</span>
                  </div>
                )}
              </div>

              <div className="px-4 pt-3 pb-1 flex items-center gap-4">
                <button
                  onClick={() => askMira(work)}
                  className={'flex items-center gap-1.5 text-xs transition-colors ' + (miraOpen === work.id ? 'text-purple-400' : 'text-gray-500 hover:text-purple-400')}
                >
                  <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center text-xs font-bold text-purple-400">M</div>
                  Ask Mira
                </button>
                <button
                  onClick={() => router.push('/artwork?id=' + work.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors ml-auto"
                >
                  View →
                </button>
              </div>

              {miraOpen === work.id && (
                <div className="mx-4 mb-3 mt-1 bg-[#111] border border-[#1a1a2e] rounded-xl p-3">
                  <div className="text-xs text-purple-400 mb-1.5">Mira</div>
                  {miraLoading === work.id ? (
                    <div className="flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                    </div>
                  ) : (
                    <div className="text-gray-300 text-sm leading-relaxed">{miraTexts[work.id]}</div>
                  )}
                </div>
              )}

              <div className="px-4 pb-3">
                {work.status && (
                  <span className={'text-xs font-medium ' + (statusColor[work.status] || 'text-gray-500')}>
                    {work.status}
                  </span>
                )}
                {work.dimensions && (
                  <span className="text-xs text-gray-600 ml-2">{work.dimensions}</span>
                )}
                {work.carolQuote && (
                  <div className="text-gray-400 text-sm mt-2 italic">"{work.carolQuote}"</div>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
