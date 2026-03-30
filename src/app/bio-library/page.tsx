'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function BioLibrary() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState(null);
  const [artworkCount, setArtworkCount] = useState(0);
  const [bios, setBios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      const uid = user.uid;
      setUserId(uid);
      setUserName(user.displayName || user.email?.split('@')[0] || 'Artist');
      try {
        const artistDoc = await getDoc(doc(db, 'artists', uid));
        if (artistDoc.exists()) {
          setUsername(artistDoc.data().username || '');
          setProfile(artistDoc.data());
        }
        const worksSnap = await getDocs(collection(db, 'artists', uid, 'artworks'));
        setArtworkCount(worksSnap.size);
        await loadBios(uid);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

  async function loadBios(uid) {
    const snap = await getDocs(collection(db, 'artists', uid, 'bios'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBios(list);
  }

  async function generateBio() {
    setGenerating(true);
    setError('');
    try {
      const prompt = `Write a professional artist biography. Strict rules:
- Exactly 3 paragraphs
- Maximum 150 words total
- Third person
- Tone: gallery-quality, warm, specific — like Tate or MoMA artist pages
- No bullet points, no lists, no headers
- Do not mention AI or this prompt

Artist details:
- Name: ${userName}
- Practice: ${profile?.practiceType || 'Visual Artist'}
- Mediums: ${profile?.mediums?.join(', ') || 'mixed media'}
- Career: ${profile?.careerLength || '20+ years'}
- Based in: ${profile?.country || ''}
- Archive: ${artworkCount} works documented

Return only the biography text, nothing else.`;

      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-uid': auth.currentUser?.uid || '' },
        body: JSON.stringify({ query: prompt, artistContext: {} }),
      });
      const data = await res.json();
      if (!data.response) throw new Error('No response from Mira');

      const text = data.response.trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const isFirstBio = bios.length === 0;

      const newBio = {
        text,
        wordCount,
        source: 'mira',
        isActive: isFirstBio,
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'artists', userId, 'bios'), newBio);
      const created = { id: docRef.id, ...newBio };
      setBios(prev => [created, ...prev]);

      // If first bio — set as active on public doc too
      if (isFirstBio) {
        await updatePublicBio(text);
      }
    } catch (err) {
      console.error(err);
      setError('Mira could not generate a bio right now. Try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function setActive(bio) {
    setSaving(bio.id);
    try {
      // Deactivate all
      await Promise.all(bios.map(b =>
        updateDoc(doc(db, 'artists', userId, 'bios', b.id), { isActive: b.id === bio.id })
      ));
      setBios(prev => prev.map(b => ({ ...b, isActive: b.id === bio.id })));
      // Update public page
      await updatePublicBio(bio.text);
    } catch (err) { console.error(err); }
    finally { setSaving(''); }
  }

  async function updatePublicBio(text) {
    if (!username) return;
    try {
      const pubRef = doc(db, 'public', username);
      const pubSnap = await getDoc(pubRef);
      if (pubSnap.exists()) {
        await updateDoc(pubRef, { bio: text, updatedAt: new Date().toISOString() });
      } else {
        await setDoc(pubRef, {
          uid: userId, username, name: userName, bio: text,
          practiceType: profile?.practiceType || '',
          country: profile?.country || '',
          email: auth.currentUser?.email || '',
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) { console.error(err); }
  }

  async function saveEdit(bio) {
    if (!editText.trim()) return;
    setSaving(bio.id);
    try {
      const wordCount = editText.trim().split(/\s+/).filter(Boolean).length;
      await updateDoc(doc(db, 'artists', userId, 'bios', bio.id), {
        text: editText.trim(),
        wordCount,
        editedAt: new Date().toISOString(),
      });
      setBios(prev => prev.map(b => b.id === bio.id ? { ...b, text: editText.trim(), wordCount } : b));
      // If this was the active bio — update public page too
      if (bio.isActive) await updatePublicBio(editText.trim());
      setEditingId(null);
      setEditText('');
    } catch (err) { console.error(err); }
    finally { setSaving(''); }
  }

  async function deleteBio(bio) {
    if (!confirm('Delete this version? This cannot be undone.')) return;
    setSaving(bio.id);
    try {
      await deleteDoc(doc(db, 'artists', userId, 'bios', bio.id));
      setBios(prev => prev.filter(b => b.id !== bio.id));
    } catch (err) { console.error(err); }
    finally { setSaving(''); }
  }

  const inp = 'w-full bg-background border border-default text-primary rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-colors';

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-3 w-full max-w-2xl px-6 animate-pulse">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-card rounded-2xl" />)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-primary pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Profile</div>
            <h1 className="text-2xl font-bold mb-1" style={{fontFamily:'var(--font-playfair)'}}>Bio Library</h1>
            <p className="text-secondary text-sm leading-relaxed max-w-sm">
              Every version Mira writes is saved here. Set one as active — that's what appears on your public page.
            </p>
          </div>
          <button onClick={() => router.push('/profile')}
            className="text-secondary text-sm hover:text-primary transition-colors flex items-center gap-1 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Profile
          </button>
        </div>

        {/* Generate button */}
        <div className="bg-card border border-default rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-primary mb-0.5">Generate with Mira</div>
              <div className="text-xs text-secondary">Creates a new 150-word biography from your archive</div>
            </div>
            <button
              onClick={generateBio}
              disabled={generating}
              className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm rounded-xl transition-all flex items-center gap-2 flex-shrink-0"
            >
              {generating ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Writing...
                </>
              ) : '✦ Generate'}
            </button>
          </div>
          {error && <div className="text-xs text-red-400 mt-2">{error}</div>}
        </div>

        {/* Bio list */}
        {bios.length === 0 && !generating && (
          <div className="text-center py-16">
            <div className="text-secondary text-sm mb-2">No bios yet.</div>
            <div className="text-muted text-xs">Generate your first bio with Mira above.</div>
          </div>
        )}

        <div className="space-y-4">
          {bios.map((bio, idx) => (
            <div key={bio.id}
              className={'bg-card border rounded-2xl overflow-hidden transition-all ' + (bio.isActive ? 'border-purple-500' : 'border-default')}>

              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-default">
                <div className="flex items-center gap-2">
                  {bio.isActive && (
                    <span className="text-xs bg-purple-900/30 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded-full">Active</span>
                  )}
                  <span className="text-xs text-secondary">
                    {new Date(bio.createdAt).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'})}
                  </span>
                  <span className="text-xs text-muted">·</span>
                  <span className="text-xs text-muted">{bio.wordCount} words</span>
                  {bio.source === 'mira' && (
                    <>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-purple-400">Mira</span>
                    </>
                  )}
                  {bio.editedAt && (
                    <>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs text-muted">edited</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!bio.isActive && (
                    <button
                      onClick={() => setActive(bio)}
                      disabled={saving !== ''}
                      className="text-xs text-purple-400 hover:text-white hover:bg-purple-700 border border-purple-800/40 px-3 py-1 rounded-lg transition-all"
                    >
                      Set active
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingId(bio.id); setEditText(bio.text); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-card-hover transition-all text-secondary hover:text-primary"
                    title="Edit"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  {!bio.isActive && (
                    <button
                      onClick={() => deleteBio(bio)}
                      disabled={saving !== ''}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-900/20 transition-all text-muted hover:text-red-400"
                      title="Delete"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Bio text or edit mode */}
              {editingId === bio.id ? (
                <div className="p-5 space-y-3">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={8}
                    className={inp + ' resize-none'}
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">
                      {editText.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingId(null); setEditText(''); }}
                        className="px-4 py-2 text-xs text-secondary border border-default rounded-xl hover:border-purple-700 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(bio)}
                        disabled={saving === bio.id}
                        className="px-4 py-2 text-xs bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white rounded-xl transition-all"
                      >
                        {saving === bio.id ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-4">
                  {bio.text.split('\n\n').map((para, i) => (
                    <p key={i} className="text-primary text-sm leading-relaxed mb-3 last:mb-0">{para}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
