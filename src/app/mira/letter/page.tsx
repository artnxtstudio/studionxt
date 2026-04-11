'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Letter {
  id: string;
  content: string;
  version: number;
  status: 'draft' | 'active';
  generatedAt: string;
  wordCount: number;
}

export default function MiraLetterPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [settingActive, setSettingActive] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [uid, setUid] = useState('');
  const [voiceCount, setVoiceCount] = useState(0);
  const [artworkCount, setArtworkCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      setUid(user.uid);
      try {
        const [lettersSnap, voicesSnap, worksSnap] = await Promise.all([
          getDocs(query(collection(db, 'artists', user.uid, 'miraLetter'), orderBy('version', 'desc'))),
          getDocs(collection(db, 'artists', user.uid, 'voices')),
          getDocs(collection(db, 'artists', user.uid, 'artworks')),
        ]);
        setLetters(lettersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Letter)));
        setVoiceCount(voicesSnap.size);
        setArtworkCount(worksSnap.size);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/mira/letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': auth.currentUser?.uid || '',
        },
      });
      if (!res.ok) throw new Error('Generation failed');
      const newLetter = await res.json();
      setLetters(prev => [{ ...newLetter, id: newLetter.id }, ...prev]);
    } catch (err) { console.error(err); }
    finally { setGenerating(false); }
  }

  async function setActive(letterId: string) {
    setSettingActive(true);
    try {
      await fetch('/api/mira/letter', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-uid': auth.currentUser?.uid || '',
        },
        body: JSON.stringify({ letterId }),
      });
      setLetters(prev => prev.map(l => ({ ...l, status: l.id === letterId ? 'active' : 'draft' })));
    } catch (err) { console.error(err); }
    finally { setSettingActive(false); }
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  }

  const currentLetter = letters.find(l => l.status === 'active') || letters[0] || null;
  const gold = '#C4A35A';
  const goldBorder = 'rgba(196,163,90,0.25)';
  const goldBg = 'rgba(196,163,90,0.06)';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: goldBg, border: `1px solid ${goldBorder}` }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-primary">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-[#221A12] px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-secondary hover:text-primary transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>M</div>
          <span className="text-sm font-medium text-primary">Mira Letter</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* GENERATING STATE */}
        {generating && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center text-lg font-bold animate-pulse" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>M</div>
            <div className="text-primary font-medium mb-2" style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem' }}>Writing your letter</div>
            <div className="text-secondary text-sm">Mira is drawing from your archive and voice sessions. This takes about 30 seconds.</div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!generating && !currentLetter && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-xl font-bold" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold, fontFamily: 'var(--font-playfair)' }}>M</div>
            <h1 className="text-2xl font-bold text-primary mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>The Mira Letter</h1>
            <p className="text-secondary text-sm max-w-md mx-auto leading-relaxed mb-2">
              A personal document written in your voice, for whoever will care for this archive after you are gone.
            </p>
            <p className="text-secondary text-sm max-w-md mx-auto leading-relaxed mb-8">
              Mira draws from your voice sessions, notes, and archive. The more you have recorded, the more complete the letter will be.
            </p>
            <button onClick={generate} className="px-8 py-3 text-sm font-medium rounded-2xl transition-all" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>
              Generate first version
            </button>
            <div className="mt-6 text-xs text-muted">
              {artworkCount} {artworkCount === 1 ? 'work' : 'works'} · {voiceCount} {voiceCount === 1 ? 'voice session' : 'voice sessions'}
              {voiceCount === 0 && <span className="block mt-1" style={{ color: gold }}>Recording voice sessions will make this letter stronger.</span>}
            </div>
          </div>
        )}

        {/* LETTER EXISTS */}
        {!generating && currentLetter && (
          <>
            {/* Status + meta */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                    background: currentLetter.status === 'active' ? 'rgba(196,163,90,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${currentLetter.status === 'active' ? goldBorder : '#2E2820'}`,
                    color: currentLetter.status === 'active' ? gold : '#8A8480',
                  }}>
                    {currentLetter.status === 'active' ? 'Active' : 'Draft'}
                  </span>
                  <span className="text-xs text-muted">Version {currentLetter.version}</span>
                </div>
                <div className="text-xs text-muted">{formatDate(currentLetter.generatedAt)} · {currentLetter.wordCount} words</div>
              </div>
              <button onClick={generate} disabled={generating} className="text-xs px-3 py-1.5 rounded-xl transition-all text-secondary hover:text-primary border border-default hover:border-[#444]">
                New version
              </button>
            </div>

            {/* The letter */}
            <div className="mb-10 pl-5" style={{ borderLeft: `2px solid ${goldBorder}` }}>
              <div className="text-primary leading-relaxed whitespace-pre-wrap" style={{ fontSize: '1rem', lineHeight: '1.85', fontFamily: 'var(--font-playfair)' }}>
                {currentLetter.content}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              {currentLetter.status === 'draft' && (
                <button onClick={() => setActive(currentLetter.id)} disabled={settingActive}
                  className="px-5 py-2.5 text-sm rounded-xl transition-all font-medium disabled:opacity-50"
                  style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>
                  {settingActive ? 'Saving...' : 'Set as active version'}
                </button>
              )}
            </div>

            {/* Version history */}
            {letters.length > 1 && (
              <div style={{ borderTop: '1px solid #2E2820' }} className="pt-6">
                <button onClick={() => setShowHistory(h => !h)} className="flex items-center gap-2 text-xs text-muted hover:text-secondary transition-colors mb-4">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                  Version history ({letters.length} versions)
                </button>
                {showHistory && (
                  <div className="space-y-2">
                    {letters.map(l => (
                      <button key={l.id} onClick={() => setActive(l.id)} disabled={l.status === 'active' || settingActive}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                        style={{ background: l.id === currentLetter.id ? goldBg : 'rgba(255,255,255,0.03)', border: `1px solid ${l.id === currentLetter.id ? goldBorder : '#2E2820'}` }}>
                        <div>
                          <span className="text-xs font-medium text-primary">Version {l.version}</span>
                          <span className="text-xs text-muted ml-2">{formatDate(l.generatedAt)}</span>
                        </div>
                        <span className="text-xs" style={{ color: l.status === 'active' ? gold : '#504840' }}>
                          {l.status === 'active' ? 'Active' : 'Set active'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
