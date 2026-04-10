'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface ArtistProfile {
  practiceType: string;
  mediums: string[];
  country: string;
  careerLength: string;
  primaryIntent: string;
}

function formatCareer(careerLength: string): string {
  const map: Record<string, string> = {
    '1-5 Years': 'over 5 years',
    '5-10 Years': 'over a decade',
    '10–20 Years': 'over two decades',
    '10-20 Years': 'over two decades',
    '20+ Years': 'more than 20 years',
    '30+ Years': 'more than 30 years',
    '40+ Years': 'more than 40 years',
    '50+ Years': 'more than 50 years',
  };
  return map[careerLength] || 'decades';
}

const MOCK_BIO = '';

export default function ProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [artworkCount, setArtworkCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState<string | null>(null);
  const [generatingBio, setGeneratingBio] = useState(false);
  const [pricingSettings, setPricingSettings] = useState<any>(null);
  const [legacyContact, setLegacyContact] = useState<any>(null);
  const [editingLegacy, setEditingLegacy] = useState(false);
  const [legacyForm, setLegacyForm] = useState({ name: '', relationship: '', email: '', phone: '' });
  const [savingLegacy, setSavingLegacy] = useState(false);
  const [userName, setUserName] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [bioError, setBioError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const userId = user?.uid;
        setUserName(user?.displayName || user?.email?.split("@")[0] || "Artist");
        if (!userId) { router.push("/login"); return; }
        const docRef = doc(db, 'artists', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as ArtistProfile);
          setUsername(docSnap.data().username || '');
          setDateOfBirth(docSnap.data().dateOfBirth || '');
        // Load pricing settings
        try {
          const { doc: d2, getDoc: g2 } = await import('firebase/firestore');
          const pSnap = await g2(d2(db, 'artists', userId, 'settings', 'pricing'));
          if (pSnap.exists()) setPricingSettings(pSnap.data());
        } catch {}
        }
        // Load legacy contact
        try {
          const { doc: ld, getDoc: lg } = await import('firebase/firestore');
          const lSnap = await lg(ld(db, 'artists', userId, 'settings', 'legacy'));
          if (lSnap.exists()) {
            setLegacyContact(lSnap.data());
            setLegacyForm(lSnap.data() as any);
          }
        } catch {}

        const artworksSnap = await getDocs(
          collection(db, 'artists', userId, 'artworks')
        );
        setArtworkCount(artworksSnap.size);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const uid = auth.currentUser?.uid;
      const user = auth.currentUser;
      if (!uid) return;
      const { doc: sd, updateDoc: ud, setDoc: ss } = await import('firebase/firestore');
      const slug = username.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const email = user?.email || '';
      // Save to private artist document
      await ud(sd(db, 'artists', uid), { username: slug, dateOfBirth, email });
      // Write safe public document — only fields safe for public access
      // email intentionally excluded — kept private in /artists/{uid} only
      await ss(sd(db, 'public', slug), {
        uid,
        username: slug,
        name: userName,
        bio: bio || '',
        practiceType: profile?.practiceType || '',
        country: profile?.country || '',
        updatedAt: new Date().toISOString(),
      });
      setUsername(slug);
      setProfileSaved(true);
      setEditingProfile(false);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSavingProfile(false); }
  }

    async function saveBio() {
    if (!bio) return;
    setSavingBio(true);
    setBioError('');
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('Not signed in');
      const { doc: sd, updateDoc: ud, setDoc: ss, getDoc: gg } = await import('firebase/firestore');
      // Save to private artist doc
      await ud(sd(db, 'artists', uid), { bio });
      // Always update public doc — create if missing
      const slug = username || uid.slice(0, 8);
      const pubRef = sd(db, 'public', slug);
      const pubSnap = await gg(pubRef);
      if (pubSnap.exists()) {
        await ud(pubRef, { bio, updatedAt: new Date().toISOString() });
      } else {
        await ss(pubRef, {
          uid,
          username: slug,
          name: userName,
          bio,
          practiceType: profile?.practiceType || '',
          country: profile?.country || '',
          updatedAt: new Date().toISOString(),
        });
      }
      setBioSaved(true);
      setTimeout(() => setBioSaved(false), 3000);
    } catch (err: any) {
      console.error('saveBio error:', err);
      setBioError(err.message || 'Save failed. Please try again.');
    } finally {
      setSavingBio(false);
    }
  }

  async function generateBio() {
    setGeneratingBio(true);
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
        body: JSON.stringify({ query: prompt, artistContext: { name: userName, practiceType: profile?.practiceType, country: profile?.country } }),
      });
      const data = await res.json();
      setBio(data.response || '');
    } catch (err) {
      console.error(err);
      setBio(MOCK_BIO);
    } finally {
      setGeneratingBio(false);
    }
  }

  async function saveLegacy() {
    setSavingLegacy(true);
    try {
      const { doc: sd, setDoc: ss } = await import('firebase/firestore');
      const unsubscribe = (await import('firebase/auth')).onAuthStateChanged;
      const auth2 = (await import('@/lib/firebase')).auth;
      await new Promise<void>(resolve => {
        const unsub = unsubscribe(auth2, async user => {
          unsub();
          const uid = user?.uid || '';
          await ss(sd(db, 'artists', uid, 'settings', 'legacy'), {
            ...legacyForm,
            updatedAt: new Date().toISOString(),
          });
          resolve();
        });
      });
      setLegacyContact(legacyForm);
      setEditingLegacy(false);
    } catch (err) { console.error(err); }
    finally { setSavingLegacy(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-purple-400 text-sm animate-pulse">Loading profile...</div>
      </div>
    );
  }

  const careerDisplay = formatCareer(profile?.careerLength || '');
  const mediumDisplay = profile?.mediums?.join(', ') || 'painting and mixed media';

  return (
    <div className="min-h-screen bg-background text-primary">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Name + photo */}
        <div className="flex items-center gap-8 mb-12">
          <div className="w-24 h-24 rounded-full bg-card border border-default flex items-center justify-center flex-shrink-0" style={{background:'rgba(126,34,206,0.15)'}}>
            <span className="text-3xl font-bold text-purple-400" style={{fontFamily:'var(--font-playfair)'}}>
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Artist Profile</div>
            <h1 className="text-4xl font-bold text-primary mb-1">{userName}</h1>
            <p className="text-secondary text-sm">
              {profile?.practiceType || 'Visual Artist'} · {profile?.country || 'United States'}
            </p>
          </div>
        </div>

        {/* Bio Library link */}
        <div className="bg-card border border-default rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-400 uppercase tracking-widest mb-1">Biography</div>
              <div className="text-sm text-primary font-semibold mb-0.5">Bio Library</div>
              <div className="text-xs text-secondary">Generate, edit and manage all versions of your biography</div>
            </div>
            <button onClick={() => router.push('/bio-library')}
              className="flex-shrink-0 px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-xl transition-all">
              Open Bio Library
            </button>
          </div>
        </div>
        {/* Practice details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Practice', value: profile?.practiceType || '—' },
            { label: 'Based in', value: profile?.country || '—' },
            { label: 'Career', value: profile?.careerLength || '—' },
            { label: 'Focus', value: profile?.primaryIntent || '—' },
          ].map(item => (
            <div key={item.label} className="bg-card border border-default rounded-xl p-5">
              <div className="text-xs text-secondary mb-2">{item.label}</div>
              <div className="text-sm text-primary capitalize">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Exhibitions */}
        <div className="bg-card border border-default rounded-2xl p-8">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Exhibitions</div>
          <p className="text-muted text-sm italic">
            Exhibition history will be added after the March studio visit.
          </p>
        </div>



        {/* ── Public Profile — username + DOB ── */}
        <div className="bg-card border border-default rounded-2xl p-8">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Public Profile</div>
          <div className="space-y-5">
            <div>
              <label className="text-xs text-secondary block mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. carol-smith"
                className="w-full rounded-xl px-4 py-3 text-sm text-primary focus:outline-none transition-colors"
                style={{background:'rgba(126,34,206,0.08)', border:'1px solid rgba(126,34,206,0.25)'}}
              />
              {username && !editingProfile && (
                <div className="mt-3 rounded-xl p-4" style={{background:'rgba(126,34,206,0.06)', border:'1px solid rgba(126,34,206,0.20)'}}>
                  <div className="text-xs text-purple-400 mb-1" style={{letterSpacing:'0.08em', textTransform:'uppercase', fontSize:'10px'}}>Your public page is live</div>
                  <div className="text-xs text-primary mb-3" style={{wordBreak:'break-all'}}>studionxt.vercel.app/artist/{username}</div>
                  <div className="flex gap-2 flex-wrap">
                    <a href={'https://studionxt.vercel.app/artist/' + username} target="_blank" rel="noopener noreferrer"
                      className="px-4 py-2 text-xs bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-all">
                      View public page
                    </a>
                    <button onClick={() => navigator.clipboard.writeText('https://studionxt.vercel.app/artist/' + username)}
                      className="px-4 py-2 text-xs text-purple-400 border border-purple-700 rounded-lg hover:bg-purple-700 hover:text-white transition-colors">
                      Copy link
                    </button>
                    <button onClick={() => router.push('/folio')}
                      className="px-4 py-2 text-xs text-secondary border border-default rounded-lg hover:border-purple-700 hover:text-primary transition-colors">
                      Edit Folio
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-secondary block mb-2">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-primary focus:outline-none transition-colors"
                style={{background:'rgba(126,34,206,0.08)', border:'1px solid rgba(126,34,206,0.25)'}}
              />
              <p className="text-xs text-muted mt-2">Used to send your Annual Archive on your birthday.</p>
            </div>
            {editingProfile ? (
              <div className="flex gap-3">
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-xl px-6 py-3 transition-colors disabled:opacity-50"
                >
                  {savingProfile ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="text-sm text-muted border border-default rounded-xl px-6 py-3 hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingProfile(true)}
                className="border border-purple-700 text-purple-400 hover:bg-purple-700 hover:text-white text-sm rounded-xl px-6 py-3 transition-colors"
              >
                {profileSaved ? 'Saved ✓' : 'Edit'}
              </button>
            )}
          </div>
        </div>

                {/* ── Legacy Contact — gold ── */}
        <div style={{background:'rgba(196,163,90,0.06)', border:'1px solid rgba(196,163,90,0.20)', borderRadius:'1rem', overflow:'hidden', marginBottom:'1rem'}}>
          <div className="flex items-center justify-between px-5 py-4" style={{borderBottom:'1px solid rgba(196,163,90,0.15)'}}>
            <div>
              <div style={{fontSize:'0.6875rem', fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'#C4A35A', marginBottom:'0.25rem'}}>
                Legacy Contact
              </div>
              <div className="text-xs text-secondary">The person who will receive access to this archive</div>
            </div>
            <button
              onClick={() => setEditingLegacy(e => !e)}
              style={{fontSize:'0.75rem', color:'#C4A35A', border:'1px solid rgba(196,163,90,0.30)', borderRadius:'0.5rem', padding:'0.375rem 0.875rem', background:'transparent', cursor:'pointer'}}
            >
              {legacyContact ? 'Edit' : 'Add'}
            </button>
          </div>

          {!editingLegacy && legacyContact && (
            <div className="px-5 py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-secondary">Name</span>
                <span className="text-xs text-primary font-medium">{legacyContact.name}</span>
              </div>
              {legacyContact.relationship && (
                <div className="flex justify-between">
                  <span className="text-xs text-secondary">Relationship</span>
                  <span className="text-xs text-primary">{legacyContact.relationship}</span>
                </div>
              )}
              {legacyContact.email && (
                <div className="flex justify-between">
                  <span className="text-xs text-secondary">Email</span>
                  <span className="text-xs text-primary">{legacyContact.email}</span>
                </div>
              )}
              {legacyContact.phone && (
                <div className="flex justify-between">
                  <span className="text-xs text-secondary">Phone</span>
                  <span className="text-xs text-primary">{legacyContact.phone}</span>
                </div>
              )}
              <div className="pt-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-green-400">Legacy contact set — archive protected</span>
              </div>
            </div>
          )}

          {!editingLegacy && !legacyContact && (
            <div className="px-5 py-6 text-center">
              <div className="text-sm text-primary mb-2" style={{fontFamily:'var(--font-playfair)'}}>Who should receive this archive?</div>
              <div className="text-xs text-secondary max-w-xs mx-auto mb-4 leading-relaxed">
                Designate one trusted person — a family member, friend, or representative — who will receive access to this archive when you are no longer able to manage it.
              </div>
              <button
                onClick={() => setEditingLegacy(true)}
                style={{background:'rgba(196,163,90,0.15)', border:'1px solid rgba(196,163,90,0.35)', color:'#C4A35A', borderRadius:'0.75rem', padding:'0.625rem 1.5rem', fontSize:'0.875rem', cursor:'pointer'}}
              >
                Designate legacy contact
              </button>
            </div>
          )}

          {editingLegacy && (
            <div className="px-5 py-4 space-y-3">
              {[
                { key: 'name', label: 'Full name', placeholder: 'Their full name', required: true },
                { key: 'relationship', label: 'Relationship', placeholder: 'e.g. Daughter, friend, gallerist' },
                { key: 'email', label: 'Email address', placeholder: 'Their email' },
                { key: 'phone', label: 'Phone number', placeholder: 'Optional' },
              ].map(field => (
                <div key={field.key}>
                  <div className="text-xs mb-1" style={{color:'rgba(196,163,90,0.8)'}}>{field.label}{field.required ? ' *' : ''}</div>
                  <input
                    value={(legacyForm as any)[field.key]}
                    onChange={e => setLegacyForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl px-4 py-3 text-sm text-primary focus:outline-none transition-colors"
                    style={{background:'rgba(196,163,90,0.06)', border:'1px solid rgba(196,163,90,0.20)'}}
                  />
                </div>
              ))}
              <div className="pt-1 text-xs text-muted leading-relaxed">
                This person will be notified if you are inactive for 90 days. They will need a Legacy Key to access the archive — you will generate this key once the full legacy system is activated.
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveLegacy}
                  disabled={savingLegacy || !legacyForm.name}
                  className="flex-1 py-3 text-sm font-medium rounded-xl transition-all disabled:opacity-40"
                  style={{background:'rgba(196,163,90,0.20)', border:'1px solid rgba(196,163,90,0.40)', color:'#C4A35A', cursor:'pointer'}}
                >
                  {savingLegacy ? 'Saving...' : 'Save legacy contact'}
                </button>
                <button
                  onClick={() => setEditingLegacy(false)}
                  className="px-4 py-3 text-sm text-secondary rounded-xl transition-all"
                  style={{border:'1px solid #2E2820', background:'transparent', cursor:'pointer'}}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Valuation profile */}
        {pricingSettings?.careerStage ? (
          <div className="bg-card border border-default rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-default">
              <div className="text-xs text-purple-400 uppercase tracking-widest">Valuation profile</div>
              <button onClick={() => router.push('/pricing')} className="text-xs text-secondary hover:text-primary transition-colors">Edit</button>
            </div>
            <div className="grid grid-cols-3 divide-x divide-[#1a1a1a]">
              {[
                { label: 'Career stage', value: pricingSettings.careerStage?.replace('MidCareer','Mid-career').replace('MuseumLevel','Museum level').replace('BlueChip','Blue chip') },
                { label: 'Primary market', value: pricingSettings.primaryMarket?.replace('RegionalGallery','Regional gallery').replace('InternationalFair','Intl fair').replace('GlobalMarket','Global market').replace('StudioSale','Studio sale') },
                { label: 'Gallery split', value: (pricingSettings.galleryCommission || '50') + '%' },
              ].map(item => (
                <div key={item.label} className="px-5 py-4 text-center">
                  <div className="text-sm font-semibold text-primary mb-1">{item.value || '—'}</div>
                  <div className="text-xs text-secondary">{item.label}</div>
                </div>
              ))}
            </div>
            {pricingSettings.country && (
              <div className="px-5 py-3 border-t border-default flex justify-between items-center">
                <div className="text-xs text-secondary">{pricingSettings.country} · {pricingSettings.currency} · {pricingSettings.hourlyRate || '50'}/hr</div>
                <div className="text-xs text-green-400">Active</div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-card border border-default rounded-2xl p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-primary mb-1">Valuation profile</div>
              <div className="text-xs text-secondary">Set once. Mira uses it for every valuation — no inputs per artwork.</div>
            </div>
            <button onClick={() => router.push('/pricing')}
              className="ml-4 flex-shrink-0 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs rounded-xl transition-all">
              Configure
            </button>
          </div>
        )}

      </div>

        {/* ── Appearance ── */}
        <div className="bg-card border border-default rounded-2xl p-6 mb-6">
          <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Appearance</div>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'light', label: 'Light', bg: '#F7F4F0', card: '#FFFFFF', bar: '#E0D8D0', dot: '#7e22ce' },
              { value: 'system', label: 'Auto', bg: '#2A2520', card: '#F7F4F0', bar: '#3A3530', dot: '#a855f7' },
              { value: 'dark', label: 'Dark', bg: '#0D0B09', card: '#171410', bar: '#2E2820', dot: '#a855f7' },
            ] as const).map(t => {
              const isActive = theme === t.value || (!theme && t.value === 'system');
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className="flex flex-col items-center gap-2 transition-all"
                >
                  {/* Mini UI preview */}
                  <div style={{
                    width: '100%',
                    borderRadius: '10px',
                    border: isActive ? '2px solid #7e22ce' : '1px solid var(--border)',
                    overflow: 'hidden',
                    transition: 'all 0.15s',
                  }}>
                    <div style={{ background: t.bg, padding: '8px', borderRadius: '8px 8px 0 0' }}>
                      <div style={{ background: t.bar, borderRadius: '3px', height: '6px', marginBottom: '5px', opacity: 0.8 }} />
                      <div style={{ background: t.card, borderRadius: '3px', height: '28px', display: 'flex', alignItems: 'center', padding: '0 6px', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.dot }} />
                        <div style={{ flex: 1, height: '3px', background: t.bar, borderRadius: '2px' }} />
                      </div>
                    </div>
                    <div style={{
                      padding: '5px 0 6px',
                      fontSize: '11px',
                      textAlign: 'center',
                      color: isActive ? '#a855f7' : 'var(--text-secondary)',
                      fontWeight: isActive ? 600 : 400,
                      background: 'var(--bg-card)',
                    }}>
                      {t.label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer links */}
        <div className="max-w-3xl mx-auto px-6 pb-12 pt-6">
          <div className="border-t border-default pt-8">
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'About StudioNXT', path: '/about' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Terms of Service', path: '/terms' },
                { label: 'Usage Policy', path: '/usage-policy' },
              ].map(l => (
                <button key={l.path} onClick={() => router.push(l.path)}
                  className="text-xs text-muted hover:text-secondary transition-colors">
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-4">© 2026 artNXT Company, Stuttgart, Germany · hello@studionxt.com</p>
          </div>
        </div>
    </div>
  );
}
