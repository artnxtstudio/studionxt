'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Letter {
  id: string;
  content: string;
  version: number;
  status: 'draft' | 'active';
  generatedAt: string;
  wordCount: number;
}

interface Question {
  id: string;
  label: string;
  question: string;
  hint: string;
}

function buildQuestions(profile: Record<string, any>, works: Record<string, any>[]): Question[] {
  const mediums = Array.isArray(profile.mediums) && profile.mediums.length > 0
    ? profile.mediums.join(' and ')
    : null;
  const workCount = works.length;
  const workTitles = works.map((w: any) => w.title).filter(Boolean).slice(0, 3);

  const questions: Question[] = [];

  // Q1: How long
  questions.push({
    id: 'how_long',
    label: 'How long',
    question: 'How long have you been making work?',
    hint: 'Say it the way you would to someone you just met. Not the formal answer.',
  });

  // Q2: What you make — use mediums if we know them
  if (mediums) {
    questions.push({
      id: 'what_you_make',
      label: 'What you make',
      question: `You work in ${mediums}. How would you describe your practice to someone who has never seen it?`,
      hint: 'Not the art-school answer. The honest one — why these materials and not others.',
    });
  } else {
    questions.push({
      id: 'what_you_make',
      label: 'What you make',
      question: 'What do you make?',
      hint: 'Not the art-school answer. The honest one.',
    });
  }

  // Q3: Works that should never be sold — reference actual archive
  if (workCount > 0 && workTitles.length > 0) {
    const titleList = workTitles.length === 1
      ? `"${workTitles[0]}"`
      : workTitles.slice(0, 2).map(t => `"${t}"`).join(', ');
    questions.push({
      id: 'never_sell',
      label: 'What stays',
      question: 'Is there a work that should never be sold? Which one, and why that one?',
      hint: `You have ${workCount} ${workCount === 1 ? 'work' : 'works'} in your archive — including ${titleList}.`,
    });
  } else {
    questions.push({
      id: 'never_sell',
      label: 'What stays',
      question: 'Are there works you intend to keep, no matter what? Which ones, and why?',
      hint: 'Even if they are not yet in your archive.',
    });
  }

  // Q4: What you were trying to do
  questions.push({
    id: 'trying_to_do',
    label: 'What you were after',
    question: 'What were you trying to figure out when you made your most recent work?',
    hint: 'The real question behind the work. Not the technical description.',
  });

  // Q5: Who understood
  questions.push({
    id: 'who_understood',
    label: 'Who understood',
    question: 'Who understood your work first? Name them.',
    hint: 'A collector, a friend, another artist, a family member. Someone specific.',
  });

  // Q6: For whoever reads this
  questions.push({
    id: 'for_whoever',
    label: 'For whoever reads this',
    question: 'What do you want whoever cares for this archive to actually do with it?',
    hint: 'Keep it together? Place it with an institution? Let works be sold slowly over time?',
  });

  return questions;
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
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [works, setWorks] = useState<Record<string, any>[]>([]);

  // Interview
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mode, setMode] = useState<'loading' | 'interview' | 'ready' | 'generating' | 'letter'>('loading');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');

  const gold = '#C4A35A';
  const goldBorder = 'rgba(196,163,90,0.25)';
  const goldBg = 'rgba(196,163,90,0.06)';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      setUid(user.uid);
      try {
        const [lettersSnap, voicesSnap, worksSnap, profileSnap, answersSnap] = await Promise.all([
          getDocs(query(collection(db, 'artists', user.uid, 'miraLetter'), orderBy('version', 'desc'))),
          getDocs(collection(db, 'artists', user.uid, 'voices')),
          getDocs(collection(db, 'artists', user.uid, 'artworks')),
          getDoc(doc(db, 'artists', user.uid)),
          getDoc(doc(db, 'artists', user.uid, 'settings', 'miraLetterAnswers')),
        ]);

        const fetchedLetters = lettersSnap.docs.map(d => ({ id: d.id, ...d.data() } as Letter));
        const fetchedProfile = profileSnap.data() || {};
        const fetchedWorks = worksSnap.docs.map(d => d.data());
        const fetchedAnswers = answersSnap.exists() ? (answersSnap.data() as Record<string, string>) : {};

        setLetters(fetchedLetters);
        setVoiceCount(voicesSnap.size);
        setArtworkCount(fetchedWorks.length);
        setProfile(fetchedProfile);
        setWorks(fetchedWorks);
        setAnswers(fetchedAnswers);

        const qs = buildQuestions(fetchedProfile, fetchedWorks);
        setQuestions(qs);

        // Always start at interview if no letters, or stay at letter if one exists
        if (fetchedLetters.length > 0) {
          setMode('letter');
        } else {
          setMode('interview');
          // Start at first unanswered question
          const firstUnanswered = qs.findIndex(q => !fetchedAnswers[q.id]?.trim());
          setCurrentQ(firstUnanswered === -1 ? 0 : firstUnanswered);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  // Pre-fill textarea when question changes
  useEffect(() => {
    if (questions[currentQ]) {
      setCurrentAnswer(answers[questions[currentQ].id] || '');
    }
  }, [currentQ, questions]);

  async function saveAnswer() {
    const q = questions[currentQ];
    const updated = { ...answers, [q.id]: currentAnswer.trim() };
    setAnswers(updated);
    setCurrentAnswer('');

    try {
      await setDoc(doc(db, 'artists', uid, 'settings', 'miraLetterAnswers'), updated, { merge: true });
    } catch (err) { console.error(err); }

    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setMode('ready');
    }
  }

  function skipQuestion() {
    setCurrentAnswer('');
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
    } else {
      setMode('ready');
    }
  }

  async function generate() {
    if (!uid) {
      setError('Not signed in. Please refresh and try again.');
      return;
    }
    setMode('generating');
    setError('');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000);

      const res = await fetch('/api/mira/letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': uid },
        body: JSON.stringify({ answers }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        let errMsg = `Server error (${res.status})`;
        try { const data = await res.json(); if (data.error) errMsg = data.error; } catch {}
        throw new Error(errMsg);
      }
      const newLetter = await res.json();
      setLetters(prev => [{ ...newLetter, id: newLetter.id }, ...prev]);
      setMode('letter');
    } catch (err: any) {
      const msg = err.name === 'AbortError'
        ? 'Generation timed out. Please try again.'
        : (err.message || 'Something went wrong. Please try again.');
      setError(msg);
      setMode('ready');
    }
  }

  async function setActive(letterId: string) {
    if (!uid) return;
    setSettingActive(true);
    try {
      await fetch('/api/mira/letter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': uid },
        body: JSON.stringify({ letterId }),
      });
      setLetters(prev => prev.map(l => ({ ...l, status: l.id === letterId ? 'active' : 'draft' })));
    } catch (err) { console.error(err); }
    finally { setSettingActive(false); }
  }

  function startNewVersion() {
    setError('');
    setMode('interview');
    const firstUnanswered = questions.findIndex(q => !answers[q.id]?.trim());
    setCurrentQ(firstUnanswered === -1 ? 0 : firstUnanswered);
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  }

  const currentLetter = letters.find(l => l.status === 'active') || letters[0] || null;
  const answeredCount = questions.filter(q => answers[q.id]?.trim()).length;

  if (loading || mode === 'loading') {
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
        <button
          onClick={() => mode === 'interview' && letters.length > 0 ? setMode('letter') : router.push('/profile')}
          className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span className="text-xs text-secondary">{mode === 'interview' && letters.length > 0 ? 'Cancel' : 'Profile'}</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>M</div>
          <span className="text-sm font-medium text-primary">Mira Letter</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ERROR */}
        {error && mode !== 'generating' && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-start justify-between gap-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#f87171' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-xs underline opacity-70 hover:opacity-100 shrink-0">Dismiss</button>
          </div>
        )}

        {/* INTERVIEW */}
        {mode === 'interview' && questions.length > 0 && (
          <div>
            {letters.length === 0 && (
              <div className="text-center mb-10">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center text-lg font-bold" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>M</div>
                <h1 className="text-2xl font-bold text-primary mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>The Mira Letter</h1>
                <p className="text-secondary text-sm max-w-sm mx-auto leading-relaxed">
                  Before Mira can write your letter, she needs to hear from you. Your words, not hers.
                </p>
              </div>
            )}

            {letters.length > 0 && (
              <div className="mb-8">
                <div className="text-xs uppercase tracking-widest mb-1" style={{ color: gold }}>New version</div>
                <p className="text-secondary text-sm">Update your answers before generating. Your previous answers are shown — change anything that has shifted.</p>
              </div>
            )}

            {/* Progress bar */}
            <div className="flex gap-1 mb-10">
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrentQ(i)}
                  className="h-0.5 flex-1 rounded-full transition-all"
                  style={{ background: answers[questions[i].id]?.trim() ? gold : i === currentQ ? 'rgba(196,163,90,0.5)' : '#2E2820' }}
                />
              ))}
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="text-xs uppercase tracking-widest mb-4" style={{ color: gold }}>{questions[currentQ].label}</div>
              <div className="text-lg font-medium text-primary mb-2" style={{ fontFamily: 'var(--font-playfair)', lineHeight: '1.5' }}>
                {questions[currentQ].question}
              </div>
              <div className="text-xs text-muted mb-5">{questions[currentQ].hint}</div>
              <textarea
                key={currentQ}
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                placeholder="Write here..."
                rows={5}
                autoFocus
                className="w-full bg-card border border-default rounded-xl px-4 py-3 text-primary text-sm leading-relaxed resize-none focus:outline-none focus:border-[#504840] placeholder-muted"
                onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) saveAnswer(); }}
              />
            </div>

            <div className="flex items-center justify-between">
              <button onClick={skipQuestion} className="text-xs text-muted hover:text-secondary transition-colors">
                {answers[questions[currentQ]?.id]?.trim() ? 'Keep current answer' : 'Skip for now'}
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted">{currentQ + 1} of {questions.length}</span>
                <button onClick={saveAnswer}
                  className="px-5 py-2 text-sm rounded-xl transition-all font-medium"
                  style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>
                  {currentQ === questions.length - 1 ? 'Done' : 'Next'}
                </button>
              </div>
            </div>

            {/* Answered summary */}
            {answeredCount > 0 && (
              <div className="mt-8 pt-6" style={{ borderTop: '1px solid #2E2820' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{answeredCount} of {questions.length} answered</span>
                  {answeredCount >= 2 && (
                    <button onClick={() => setMode('ready')}
                      className="text-xs px-3 py-1.5 rounded-xl transition-all"
                      style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>
                      Generate with these answers
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* READY */}
        {mode === 'ready' && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center text-lg font-bold" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>M</div>
            <h1 className="text-xl font-bold text-primary mb-3" style={{ fontFamily: 'var(--font-playfair)' }}>
              {letters.length > 0 ? 'Ready for a new version' : 'Ready to write'}
            </h1>
            <p className="text-secondary text-sm max-w-sm mx-auto leading-relaxed mb-8">
              Mira will write from what you have recorded. Nothing will be invented. If information is missing, the letter will say so plainly.
            </p>
            <div className="flex items-center justify-center gap-5 mb-8 text-xs text-muted">
              <span>{artworkCount} {artworkCount === 1 ? 'work' : 'works'}</span>
              <span>{voiceCount} {voiceCount === 1 ? 'voice session' : 'voice sessions'}</span>
              <span>{answeredCount} of {questions.length} questions answered</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button onClick={generate}
                className="px-8 py-3 text-sm font-medium rounded-2xl transition-all"
                style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>
                Generate letter
              </button>
              <button onClick={() => { setMode('interview'); setCurrentQ(0); }}
                className="text-xs text-muted hover:text-secondary transition-colors underline">
                Review your answers first
              </button>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {mode === 'generating' && (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center text-lg font-bold animate-pulse" style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>M</div>
            <div className="text-primary font-medium mb-2" style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem' }}>Writing your letter</div>
            <div className="text-secondary text-sm">Only your words. This takes about 30 seconds.</div>
          </div>
        )}

        {/* LETTER */}
        {mode === 'letter' && currentLetter && (
          <>
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
              <button onClick={startNewVersion}
                className="text-xs px-3 py-1.5 rounded-xl transition-all text-secondary hover:text-primary border border-default hover:border-[#444]">
                New version
              </button>
            </div>

            <div className="mb-10 pl-5" style={{ borderLeft: `2px solid ${goldBorder}` }}>
              <div className="text-primary leading-relaxed whitespace-pre-wrap" style={{ fontSize: '1rem', lineHeight: '1.85', fontFamily: 'var(--font-playfair)' }}>
                {currentLetter.content}
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              {currentLetter.status === 'draft' && (
                <button onClick={() => setActive(currentLetter.id)} disabled={settingActive}
                  className="px-5 py-2.5 text-sm rounded-xl transition-all font-medium disabled:opacity-50"
                  style={{ background: goldBg, border: `1px solid ${goldBorder}`, color: gold }}>
                  {settingActive ? 'Saving...' : 'Set as active version'}
                </button>
              )}
            </div>

            {letters.length > 1 && (
              <div style={{ borderTop: '1px solid #2E2820' }} className="pt-6">
                <button onClick={() => setShowHistory(h => !h)} className="flex items-center gap-2 text-xs text-muted hover:text-secondary transition-colors mb-4">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
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
