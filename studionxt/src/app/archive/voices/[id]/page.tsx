'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function VoiceSession({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [edit, setEdit] = useState({ title: '', notes: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || '';
      setUserId(uid);
      try {
        const snap = await getDoc(doc(db, 'artists', uid, 'voices', params.id));
        if (snap.exists()) {
          const data: any = { id: snap.id, ...snap.data() };
          setSession(data);
          setEdit({ title: data.title || '', notes: data.notes || '' });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [params.id]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'artists', userId, 'voices', params.id), edit);
      setSession((s: any) => ({ ...s, ...edit }));
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
      await deleteDoc(doc(db, 'artists', userId, 'voices', params.id));
      router.push('/archive');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B09] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-6 animate-pulse">
          <div className="h-6 bg-[#171410] rounded w-1/3"></div>
          <div className="h-4 bg-[#171410] rounded w-1/2"></div>
          <div className="h-64 bg-[#171410] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0D0B09] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-4">Session not found.</div>
          <button onClick={() => router.push('/archive')} className="text-purple-400 text-sm">Back to Archive</button>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full bg-[#1E1A16] border border-[#3D3530] text-[#F5F0EB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors';

  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex justify-between items-center mb-8">
          <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-[#F5F0EB] transition-colors">
            Back to Archive
          </button>
          <div className="flex gap-2">
            <button onClick={() => setEditing(e => !e)} className="px-4 py-2 border border-[#3D3530] hover:border-purple-700 text-gray-400 hover:text-[#F5F0EB] text-xs rounded-lg transition-all">
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 border border-[#3D3530] hover:border-red-700 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all">
              Delete
            </button>
          </div>
        </div>

        <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">
          Voices · {session.mode === 'guided' ? 'Guided' : 'Free'}
        </div>

        {editing ? (
          <div className="space-y-4 mb-8">
            <div>
              <label className="text-xs text-purple-400 mb-1.5 block">Title</label>
              <input value={edit.title} onChange={e => setEdit(v => ({ ...v, title: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-purple-400 mb-1.5 block">Notes</label>
              <textarea value={edit.notes} onChange={e => setEdit(v => ({ ...v, notes: e.target.value }))} rows={3} className={inputClass + ' resize-none'} placeholder="Any notes about this session..." />
            </div>
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-xl transition-all">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        ) : (
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#F5F0EB] mb-2">{session.title || 'Untitled session'}</h1>
            <div className="text-gray-500 text-sm">{session.topic || 'General practice'} · {session.createdAt ? new Date(session.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
            {session.notes && <div className="mt-3 text-gray-400 text-sm">{session.notes}</div>}
          </div>
        )}

        {session.summary && (
          <div className="bg-[#171410] border border-[#1a1a2e] rounded-2xl p-5 mb-6">
            <div className="text-xs text-purple-400 mb-2">Mira's summary</div>
            <div className="text-gray-300 text-sm leading-relaxed">{session.summary}</div>
          </div>
        )}

        {session.audioUrl && (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-5 mb-6">
            <div className="text-xs text-purple-400 mb-3">Audio recording</div>
            <audio controls src={session.audioUrl} className="w-full rounded-lg" />
          </div>
        )}

        {session.transcript && session.transcript.length > 0 && (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-5">
            <div className="text-xs text-purple-400 mb-4">Full transcript</div>
            <div className="space-y-4">
              {session.transcript.map((msg: any, i: number) => (
                <div key={i} className={'flex ' + (msg.role === 'artist' ? 'justify-end' : 'justify-start')}>
                  <div className={'max-w-sm px-4 py-3 rounded-2xl text-sm leading-relaxed ' + (msg.role === 'artist' ? 'bg-purple-700 text-[#F5F0EB] rounded-br-sm' : 'bg-[#1E1A16] text-gray-300 rounded-bl-sm')}>
                    {msg.role === 'mira' && <div className="text-xs text-purple-400 mb-1">Mira</div>}
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#171410] border border-[#3D3530] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl mb-2">Delete this session?</div>
            <p className="text-gray-500 text-sm mb-8">This will permanently remove the transcript and audio. This cannot be undone.</p>
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
