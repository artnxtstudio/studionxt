'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const DOC_TYPES = ['Contract','Certificate of Authenticity','Press','Exhibition Catalogue','Invoice','Insurance','Provenance','Photo','Other'];

export default function DocumentDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [userId, setUserId] = useState('');
  const [artworks, setArtworks] = useState<any[]>([]);
  const [edit, setEdit] = useState({ name: '', type: 'Document', date: '', issuer: '', notes: '', linkedArtworkId: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const uid = user?.uid || '';
      setUserId(uid);
      try {
        const [snap, artSnap] = await Promise.all([
          getDoc(doc(db, 'artists', uid, 'documents', params.id)),
          getDocs(collection(db, 'artists', uid, 'artworks')),
        ]);
        if (snap.exists()) {
          const data: any = { id: snap.id, ...snap.data() };
          setItem(data);
          setEdit({ name: data.name || '', type: data.type || 'Document', date: data.date || '', issuer: data.issuer || '', notes: data.notes || '', linkedArtworkId: data.linkedArtworkId || '' });
        }
        setArtworks(artSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [params.id]);

  function setE(key: string, value: string) {
    setEdit(e => ({ ...e, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'artists', userId, 'documents', params.id), edit);
      setItem((d: any) => ({ ...d, ...edit }));
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
      await deleteDoc(doc(db, 'artists', userId, 'documents', params.id));
      router.push('/archive');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0B09] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-6 animate-pulse">
          <div className="h-6 bg-[#171410] rounded w-1/2"></div>
          <div className="h-48 bg-[#171410] rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#0D0B09] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-4">Document not found.</div>
          <button onClick={() => router.push('/archive')} className="text-purple-400 text-sm">Back to Archive</button>
        </div>
      </div>
    );
  }

  const inputClass = 'w-full bg-[#1E1A16] border border-[#3D3530] text-[#F5F0EB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const labelClass = 'text-xs text-purple-400 mb-1.5 block';
  const linkedArtwork = artworks.find(a => a.id === item.linkedArtworkId);

  const fields = [
    ['Type', item.type],
    ['Date', item.date],
    ['Issuer', item.issuer],
    ['Linked artwork', linkedArtwork ? (linkedArtwork.title || 'Untitled') : null],
    ['Size', item.size],
  ].filter(function(pair) { return pair[1]; });

  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB]">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
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

        <div className="mb-8">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Documents</div>
          <h1 className="text-xl font-bold text-[#F5F0EB]">{item.name}</h1>
        </div>

        {editing ? (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-6 space-y-5 mb-6">
            <div>
              <label className={labelClass}>File name</label>
              <input value={edit.name} onChange={e => setE('name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Document type</label>
              <select value={edit.type} onChange={e => setE('type', e.target.value)} className={inputClass}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Date of document</label>
              <input type="date" value={edit.date} onChange={e => setE('date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Issuer</label>
              <input value={edit.issuer} onChange={e => setE('issuer', e.target.value)} placeholder="e.g. Sotheby's, The New York Times" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Linked artwork</label>
              <select value={edit.linkedArtworkId} onChange={e => setE('linkedArtworkId', e.target.value)} className={inputClass}>
                <option value="">Not linked to a specific work</option>
                {artworks.map(a => <option key={a.id} value={a.id}>{a.title || 'Untitled'} {a.year ? '(' + a.year + ')' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea value={edit.notes} onChange={e => setE('notes', e.target.value)} rows={3} placeholder="e.g. Sale to MoMA, 2019" className={inputClass + ' resize-none'} />
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-xl transition-all">
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        ) : (
          <div className="bg-[#171410] border border-[#2E2820] rounded-xl overflow-hidden mb-6">
            {fields.map((pair, i) => (
              <div key={pair[0] as string} className={'flex justify-between px-4 py-3' + (i < fields.length - 1 ? ' border-b border-[#2A2318]' : '')}>
                <span className="text-xs text-gray-500">{pair[0]}</span>
                <span className="text-xs text-[#F5F0EB] font-medium">{pair[1]}</span>
              </div>
            ))}
            {item.notes && (
              <div className="px-4 py-3 border-t border-[#2A2318]">
                <div className="text-xs text-gray-500 mb-1">Notes</div>
                <div className="text-xs text-gray-300">{item.notes}</div>
              </div>
            )}
          </div>
        )}

        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block w-full text-center px-6 py-3 border border-purple-700 hover:bg-purple-700 text-purple-400 hover:text-[#F5F0EB] text-sm rounded-xl transition-all">
          Open document
        </a>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#171410] border border-[#3D3530] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl mb-2">Delete this document?</div>
            <p className="text-gray-500 text-sm mb-8">This will remove "{item.name}" from the archive.</p>
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