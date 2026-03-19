'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';

export default function NewWIP() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [userId, setUserId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [title, setTitle] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUserId(user?.uid || '');
    });
    return () => unsubscribe();
  }, []);

  function handleFile(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setStep(1);
  }

  async function handleSave() {
    if (!imageFile) return;
    setSaving(true);
    try {
      const timestamp = Date.now();
      const imgRef = ref(storage, 'wip/' + userId + '/new/' + timestamp + '.jpg');
      await uploadBytes(imgRef, imageFile);
      const imageUrl = await getDownloadURL(imgRef);
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': auth.currentUser?.uid || '' },
        body: JSON.stringify({
          query: 'An artist just started tracking a new work in progress: "' + (title || 'Untitled') + '". They are trying to solve: "' + (problem || 'not yet defined') + '". Ask them one generous, precise question to help them think about this work. One question only.',
          artistContext: {},
        }),
      });
      const data = await res.json();
      const firstEntry = {
        imageUrl,
        note: '',
        miraQuestion: data.response || 'What drew you to start this work right now?',
        date: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'artists', userId, 'wip'), {
        title: title || 'Untitled work',
        problem,
        status: 'Active',
        timeline: [firstEntry],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId,
      });
      router.push('/archive/wip/' + docRef.id);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const input = 'w-full bg-[#0D0B09] border border-[#3D3530] text-[#F5F0EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const labelClass = 'text-xs text-purple-400 mb-1.5 block';

  if (step === 0) {
    return (
      <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <button onClick={() => router.back()} className="text-gray-500 text-sm mb-8 hover:text-[#F5F0EB] transition-colors">Back</button>
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Work in Progress</div>
          <h1 className="text-2xl font-bold mb-2">Start with a photo</h1>
          <p className="text-gray-500 text-sm mb-10">Photograph what you are working on right now. Mira will respond.</p>
          <div className="space-y-3">
            <label className="flex items-center gap-4 w-full px-5 py-4 bg-purple-700 hover:bg-purple-600 rounded-2xl cursor-pointer transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <div className="text-left">
                <div className="text-sm font-semibold">Take photo</div>
                <div className="text-xs text-purple-300">Open camera now</div>
              </div>
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
            <label className="flex items-center gap-4 w-full px-5 py-4 bg-[#171410] border border-[#3D3530] hover:border-purple-700 rounded-2xl cursor-pointer transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div className="text-left">
                <div className="text-sm font-semibold text-[#F5F0EB]">Upload from library</div>
                <div className="text-xs text-gray-500">Choose existing photo</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB] pb-24">
      <div className="sticky top-0 z-10 bg-[#0D0B09]/95 backdrop-blur border-b border-[#221A12] px-4 py-3 flex justify-between items-center">
        <button onClick={() => setStep(0)} className="text-gray-500 text-sm hover:text-[#F5F0EB]">Back</button>
        <span className="text-sm font-medium text-[#F5F0EB]">New WIP</span>
        <button onClick={handleSave} disabled={saving} className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-40 font-medium">
          {saving ? 'Saving...' : 'Start tracking'}
        </button>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {imagePreview && (
          <div className="relative">
            <img src={imagePreview} alt="WIP" className="w-full object-contain max-h-72 rounded-2xl bg-[#171410]" />
            <button onClick={() => { setStep(0); setImagePreview(''); setImageFile(null); }} className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-[#F5F0EB] text-sm">
              ✕
            </button>
          </div>
        )}
        <div>
          <label className={labelClass}>Working title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What are you calling this for now?" className={input} />
        </div>
        <div>
          <label className={labelClass}>What are you trying to solve?</label>
          <textarea value={problem} onChange={e => setProblem(e.target.value)} placeholder="The question, problem, or feeling you are working through..." rows={4} className={input + ' resize-none'} />
        </div>
        <p className="text-xs text-gray-600">Mira will ask you one question when you save.</p>
      </div>
    </div>
  );
}
