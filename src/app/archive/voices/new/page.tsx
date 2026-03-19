'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

const TOPICS = [
  'A specific artwork',
  'A period of my life',
  'My practice in general',
  'How I started making art',
  'A turning point',
  'What I am working on now',
];

const GUIDED_QUESTIONS = [
  'Tell me about when you made this work. Where were you in your life?',
  'What were you trying to figure out or express?',
  'Was there a moment during the making where something shifted?',
  'How do you feel about this work now, looking back?',
  'What do you want people to understand about it?',
  'Is there anything about this work that still feels unresolved?',
];

export default function NewVoiceSession() {
  const router = useRouter();
  const [mode, setMode] = useState<'guided' | 'free'>('guided');
  const [step, setStep] = useState<'setup' | 'session' | 'done'>('setup');
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [artworks, setArtworks] = useState<any[]>([]);
  const [linkedArtwork, setLinkedArtwork] = useState('');
  const [userId, setUserId] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState<{role: string; text: string}[]>([]);
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [miraThinking, setMiraThinking] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'free') setMode('free');
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || '';
      setUserId(uid);
      const snap = await getDocs(collection(db, 'artists', uid, 'artworks'));
      setArtworks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, miraThinking]);

  function startSession() {
    if (mode === 'guided') {
      setTranscript([{ role: 'mira', text: GUIDED_QUESTIONS[0] }]);
    } else {
      setTranscript([{ role: 'mira', text: 'I am here. Tell me whatever is on your mind about your work — no structure needed. Just talk.' }]);
    }
    setStep('session');
  }

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = { role: 'artist', text: input.trim() };
    setInput('');
    setTranscript(t => [...t, userMsg]);
    setMiraThinking(true);
    try {
      if (mode === 'guided' && questionIndex < GUIDED_QUESTIONS.length - 1) {
        await new Promise(r => setTimeout(r, 1200));
        const next = GUIDED_QUESTIONS[questionIndex + 1];
        setTranscript(t => [...t, { role: 'mira', text: next }]);
        setQuestionIndex(i => i + 1);
      } else {
        const res = await fetch('/api/mira', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-uid': auth.currentUser?.uid || '' },
          body: JSON.stringify({
            query: 'The artist said: "' + userMsg.text + '". Respond warmly in 1-2 sentences as their studio assistant, acknowledging what they shared and gently inviting them to continue.',
            artistContext: { topic, linkedArtwork },
          }),
        });
        const data = await res.json();
        setTranscript(t => [...t, { role: 'mira', text: data.response || 'Thank you for sharing that.' }]);
      }
    } finally {
      setMiraThinking(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch {
      alert('Microphone access denied.');
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function saveSession() {
    setSaving(true);
    try {
      let audioUrl = '';
      if (audioBlob) {
        const audioRef = ref(storage, 'audio/' + userId + '/sessions/' + Date.now() + '.webm');
        await uploadBytes(audioRef, audioBlob);
        audioUrl = await getDownloadURL(audioRef);
      }
      const fullTranscript = transcript.map(t => t.role + ': ' + t.text).join('\n');
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': auth.currentUser?.uid || '' },
        body: JSON.stringify({
          query: 'Summarize this oral history session in 2-3 sentences, capturing the emotional essence and key themes: ' + fullTranscript,
          artistContext: {},
        }),
      });
      const data = await res.json();
      await addDoc(collection(db, 'artists', userId, 'voices'), {
        title: title || topic || 'Session ' + new Date().toLocaleDateString(),
        topic,
        mode,
        linkedArtwork,
        transcript,
        audioUrl,
        summary: data.response || '',
        createdAt: new Date().toISOString(),
        userId,
      });
      setStep('done');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">🎙</div>
          <h2 className="text-xl font-bold mb-2">Session saved</h2>
          <p className="text-gray-500 text-sm mb-8">This conversation is now part of the archive. Mira has summarized it for you.</p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/archive?tab=voices')} className="flex-1 px-4 py-3 border border-[#3D3530] text-gray-400 text-sm rounded-xl hover:border-purple-700 transition-all">
              View all sessions
            </button>
            <button onClick={() => router.push('/archive/voices/new')} className="flex-1 px-4 py-3 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all">
              New session
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB] flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <button onClick={() => router.back()} className="text-gray-500 text-sm mb-6 hover:text-[#F5F0EB]">Back</button>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Voices</div>
          <h1 className="text-2xl font-bold text-[#F5F0EB] mb-8">New session</h1>

          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-6 space-y-6">
            <div>
              <div className="text-xs text-gray-500 mb-3">Mode</div>
              <div className="grid grid-cols-2 gap-3">
                {([['guided', 'Guided', 'Mira asks questions'], ['free', 'Free', 'Just talk']] as const).map(([m, label, sub]) => (
                  <button key={m} onClick={() => setMode(m)} className={'p-4 rounded-xl border text-left transition-all ' + (mode === m ? 'border-purple-500 bg-purple-900/30' : 'border-[#3D3530] hover:border-purple-700')}>
                    <div className="text-sm text-[#F5F0EB] font-medium mb-1">{label}</div>
                    <div className="text-xs text-gray-500">{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-3">What do you want to talk about?</div>
              <div className="flex flex-wrap gap-2">
                {TOPICS.map(t => (
                  <button key={t} onClick={() => setTopic(topic === t ? '' : t)} className={'px-3 py-1.5 rounded-full border text-xs transition-all ' + (topic === t ? 'border-purple-500 bg-purple-900 text-purple-200' : 'border-[#3D3530] text-gray-400 hover:border-purple-700')}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {topic === 'A specific artwork' && artworks.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 mb-3">Which artwork?</div>
                <select value={linkedArtwork} onChange={e => setLinkedArtwork(e.target.value)} className="w-full bg-[#1E1A16] border border-[#3D3530] text-[#F5F0EB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500">
                  <option value="">Select artwork...</option>
                  {artworks.map(a => <option key={a.id} value={a.id}>{a.title || 'Untitled'} {a.year ? '(' + a.year + ')' : ''}</option>)}
                </select>
              </div>
            )}

            <div>
              <div className="text-xs text-gray-500 mb-2">Session title — optional</div>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Talking about the blue paintings" className="w-full bg-[#1E1A16] border border-[#3D3530] text-[#F5F0EB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500" />
            </div>

            <button onClick={startSession} className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all font-medium">
              Start session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB] flex flex-col">
      <div className="border-b border-[#2A2318] px-4 py-4 flex justify-between items-center">
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest">Voices · {mode === 'guided' ? 'Guided' : 'Free'}</div>
          <div className="text-sm font-medium text-[#F5F0EB] mt-0.5">{title || topic || 'Session'}</div>
        </div>
        <div className="flex gap-2">
          {!recording ? (
            <button onClick={startRecording} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-[#F5F0EB] text-xs rounded-lg transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
              Record
            </button>
          ) : (
            <button onClick={stopRecording} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900 border border-red-500 text-red-300 text-xs rounded-lg animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
              Stop
            </button>
          )}
          {audioBlob && <div className="flex items-center px-3 py-1.5 border border-green-800 text-green-400 text-xs rounded-lg">Audio ready</div>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {transcript.map((msg, i) => (
          <div key={i} className={'flex ' + (msg.role === 'artist' ? 'justify-end' : 'justify-start')}>
            <div className={'max-w-xs sm:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ' + (msg.role === 'artist' ? 'bg-purple-700 text-[#F5F0EB] rounded-br-sm' : 'bg-[#171410] border border-[#2E2820] text-gray-300 rounded-bl-sm')}>
              {msg.role === 'mira' && <div className="text-xs text-purple-400 mb-1">Mira</div>}
              {msg.text}
            </div>
          </div>
        ))}
        {miraThinking && (
          <div className="flex justify-start">
            <div className="bg-[#171410] border border-[#2E2820] px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="text-xs text-purple-400 mb-1">Mira</div>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-[#2A2318] px-4 py-4 max-w-2xl mx-auto w-full">
        <div className="flex gap-3 mb-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type or speak..."
            className="flex-1 bg-[#171410] border border-[#3D3530] text-[#F5F0EB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          />
          <button onClick={sendMessage} disabled={!input.trim()} className="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-xl transition-all">
            Send
          </button>
        </div>
        <button onClick={saveSession} disabled={saving || transcript.length < 2} className="w-full py-2.5 border border-[#3D3530] hover:border-purple-700 text-gray-400 hover:text-[#F5F0EB] text-xs rounded-xl transition-all disabled:opacity-40">
          {saving ? 'Saving session...' : 'End and save session'}
        </button>
      </div>
    </div>
  );
}
