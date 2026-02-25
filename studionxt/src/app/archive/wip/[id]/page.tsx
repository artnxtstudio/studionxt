'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';

export default function WIPDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [work, setWork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('demo-user');
  const [uploading, setUploading] = useState(false);
  const [miraThinking, setMiraThinking] = useState(false);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editProblem, setEditProblem] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [lightbox, setLightbox] = useState('');
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || 'demo-user';
      setUserId(uid);
      try {
        const snap = await getDoc(doc(db, 'artists', uid, 'wip', params.id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setWork(data);
          setEditTitle(data.title || '');
          setEditProblem(data.problem || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [params.id]);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const timestamp = Date.now();
      const imgRef = ref(storage, 'wip/' + userId + '/' + params.id + '/' + timestamp + '.jpg');
      await uploadBytes(imgRef, file);
      const imageUrl = await getDownloadURL(imgRef);
      setMiraThinking(true);
      setUploading(false);
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Artist photographed work in progress: "' + (work?.title || 'Untitled') + '". Problem: "' + (work?.problem || '') + '". Ask one generous precise question. One only.',
          artistContext: {},
        }),
      });
      const data = await res.json();
      const entry = {
        imageUrl,
        note: note.trim(),
        miraQuestion: data.response || 'What feels unresolved right now?',
        date: new Date().toISOString(),
      };
      const updatedTimeline = [...(work.timeline || []), entry];
      await updateDoc(doc(db, 'artists', userId, 'wip', params.id), {
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      });
      setWork((w: any) => ({ ...w, timeline: updatedTimeline }));
      setNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setMiraThinking(false);
    }
  }

  async function updateStatus(status: string) {
    await updateDoc(doc(db, 'artists', userId, 'wip', params.id), { status });
    setWork((w: any) => ({ ...w, status }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'artists', userId, 'wip', params.id), {
        title: editTitle,
        problem: editProblem,
      });
      setWork((w: any) => ({ ...w, title: editTitle, problem: editProblem }));
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'artists', userId, 'wip', params.id));
      router.push('/archive/wip');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  async function moveToArchive() {
    if (!work.timeline || work.timeline.length === 0) {
      alert('Add at least one photo first.');
      return;
    }
    setMoving(true);
    try {
      const last = work.timeline[work.timeline.length - 1];
      await addDoc(collection(db, 'artists', userId, 'artworks'), {
        title: work.title,
        medium: '',
        year: new Date().getFullYear().toString(),
        status: 'Available',
        imageUrl: last.imageUrl,
        originalUrl: last.imageUrl,
        notes: work.problem,
        wipId: params.id,
        createdAt: new Date().toISOString(),
        userId,
      });
      await updateDoc(doc(db, 'artists', userId, 'wip', params.id), {
        status: 'Completed',
        completedAt: new Date().toISOString(),
      });
      router.push('/archive');
    } catch (err) {
      console.error(err);
    } finally {
      setMoving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0908] flex items-center justify-center">
        <div className="w-full max-w-5xl px-6 grid grid-cols-2 gap-8 animate-pulse">
          <div className="h-96 bg-[#141210] rounded-2xl" />
          <div className="space-y-4 pt-8">
            <div className="h-4 bg-[#141210] rounded w-1/4" />
            <div className="h-8 bg-[#141210] rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen bg-[#0A0908] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-4">Work not found.</div>
          <button onClick={() => router.push('/archive/wip')} className="text-purple-400 text-sm">Back</button>
        </div>
      </div>
    );
  }

  const STATUSES = ['Active', 'Paused', 'Abandoned'];
  const statusColor: Record<string, string> = {
    Active: 'border-green-800 text-green-400',
    Paused: 'border-yellow-800 text-yellow-400',
    Abandoned: 'border-red-900 text-red-500',
  };
  const inp = 'w-full bg-[#1A1815] border border-[#3D3530] text-[#F5F0EB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const latestImage = work.timeline && work.timeline.length > 0
    ? work.timeline[work.timeline.length - 1].imageUrl
    : null;

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F0EB]">

      <div className="px-6 py-4 flex justify-between items-center border-b border-[#1A1715]">
        <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-[#F5F0EB] transition-colors">
          Back to Archive
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(e => !e)}
            className="px-4 py-1.5 border border-[#3D3530] hover:border-purple-700 text-gray-400 hover:text-[#F5F0EB] text-xs rounded-lg transition-all"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-4 py-1.5 border border-[#3D3530] hover:border-red-700 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          <div>
            {latestImage ? (
              <div>
                <img
                  src={latestImage}
                  alt={work.title}
                  onClick={() => setLightbox(latestImage)}
                  className="w-full object-contain rounded-2xl bg-[#141210] cursor-zoom-in max-h-[70vh]"
                />
                <div className="text-center mt-2 text-xs text-gray-600">Tap to enlarge</div>
              </div>
            ) : (
              <div className="w-full h-96 bg-[#141210] rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3 opacity-20">🎨</div>
                  <div className="text-gray-600 text-sm">No photos yet</div>
                </div>
              </div>
            )}
            {work.timeline && work.timeline.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {[...work.timeline].reverse().map((entry: any, i: number) => (
                  <img
                    key={i}
                    src={entry.imageUrl}
                    alt=""
                    onClick={() => setLightbox(entry.imageUrl)}
                    className="w-16 h-16 object-contain bg-[#141210] rounded-lg flex-shrink-0 cursor-zoom-in hover:opacity-80 transition-all border border-[#2A2520] hover:border-purple-700"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Work in Progress</div>
              <h1 className="text-3xl font-bold text-[#F5F0EB] mb-1">{work.title || 'Untitled'}</h1>
              <div className="text-gray-500 text-sm">
                {work.timeline ? work.timeline.length : 0} photos · Started {work.createdAt ? new Date(work.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
              </div>
            </div>

            <div className="flex gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={'px-3 py-1 rounded-full border text-xs transition-all ' + (work.status === s ? statusColor[s] : 'border-[#3D3530] text-gray-600 hover:border-gray-500')}
                >
                  {s}
                </button>
              ))}
            </div>

            {!editing && work.problem && (
              <div className="bg-[#141210] border border-[#2A2520] rounded-2xl p-4">
                <div className="text-xs text-purple-400 mb-2">What I am trying to solve</div>
                <div className="text-gray-300 text-sm leading-relaxed">{work.problem}</div>
              </div>
            )}

            {editing && (
              <div className="bg-[#141210] border border-[#2A2520] rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-xs text-purple-400 mb-1.5 block">Working title</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="text-xs text-purple-400 mb-1.5 block">What are you trying to solve?</label>
                  <textarea value={editProblem} onChange={e => setEditProblem(e.target.value)} rows={4} className={inp + ' resize-none'} />
                </div>
                <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-xl transition-all">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            )}

            <div className="bg-[#141210] border border-[#2A2520] rounded-2xl p-4 space-y-3">
              <div className="text-xs text-purple-400 uppercase tracking-widest">Add a moment</div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What changed? What are you noticing? (optional)"
                rows={2}
                className={inp + ' resize-none'}
              />
              {uploading || miraThinking ? (
                <div className="text-xs text-purple-400 animate-pulse py-2">
                  {uploading ? 'Uploading...' : 'Mira is looking at your work...'}
                </div>
              ) : (
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-xs rounded-xl cursor-pointer transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    Take photo
                    <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-[#3D3530] hover:border-purple-700 text-gray-400 hover:text-[#F5F0EB] text-xs rounded-xl cursor-pointer transition-all">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    Upload
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </label>
                </div>
              )}
            </div>

            <button
              onClick={moveToArchive}
              disabled={moving}
              className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-xl transition-all"
            >
              {moving ? 'Moving...' : 'Save to Archive'}
            </button>
          </div>
        </div>

        {work.timeline && work.timeline.length > 0 && (
          <div className="mt-12">
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">
              Timeline — {work.timeline.length} {work.timeline.length === 1 ? 'moment' : 'moments'}
            </div>
            <div className="space-y-5">
              {[...work.timeline].reverse().map((entry: any, i: number) => (
                <div key={i} className="bg-[#141210] border border-[#2A2520] rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    <img
                      src={entry.imageUrl}
                      alt="WIP"
                      onClick={() => setLightbox(entry.imageUrl)}
                      className="w-full object-contain max-h-72 bg-[#0A0908] cursor-zoom-in hover:opacity-90 transition-all"
                    />
                    <div className="p-5 space-y-3">
                      <div className="text-xs text-gray-600">
                        {entry.date ? new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                      </div>
                      {entry.note && <div className="text-sm text-gray-300">{entry.note}</div>}
                      {entry.miraQuestion && (
                        <div className="bg-[#0A0908] border border-[#1a1a2e] rounded-xl p-4">
                          <div className="text-xs text-purple-400 mb-1">Mira</div>
                          <div className="text-sm text-gray-300 italic">{entry.miraQuestion}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox('')}>
          <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="" className="w-full object-contain max-h-[85vh] rounded-lg" />
            <div className="flex justify-between items-center mt-3">
              <button onClick={() => setLightbox('')} className="text-gray-400 hover:text-[#F5F0EB] text-sm">✕ Close</button>
              <a href={lightbox} download target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-[#F5F0EB] text-sm rounded-xl transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download full size
              </a>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141210] border border-[#3D3530] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl font-bold mb-2">Delete this work?</div>
            <p className="text-gray-500 text-sm mb-8">All photos and timeline entries will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-3 border border-[#3D3530] text-gray-400 text-sm rounded-xl">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-3 bg-red-700 hover:bg-red-600 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-xl">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
