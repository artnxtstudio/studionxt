'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ArtworkEdit from '@/components/ArtworkEdit';
import CarolVoice from '@/components/CarolVoice';
import Valuation from '@/components/PriceIntelligence';
import EditionLedger from '@/components/EditionLedger';
import LocationCard from '@/components/LocationCard';

const STATUSES = ['Available', 'Sold', 'Consigned', 'Not for sale'];
const statusColor: Record<string, string> = {
  Available: 'text-purple-700 border-purple-400 bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:bg-purple-900/20',
  Sold: 'text-green-400 border-green-800 bg-green-900/20',
  Consigned: 'text-yellow-400 border-yellow-800 bg-yellow-900/20',
  'Not for sale': 'text-secondary border-gray-700 bg-gray-900/20',
};

export default function ArtworkPage() {
  const router = useRouter();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enlarged, setEnlarged] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [userId, setUserId] = useState('');
  const [artworkId, setArtworkId] = useState('');
  const [activeTab, setActiveTab] = useState<'record'|'voice'|'value'>('record');

  // Quick action states
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [savingField, setSavingField] = useState<string|null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id') || '';
    setArtworkId(id);
    if (!id) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const uid = user?.uid || '';
        setUserId(uid);
        const snap = await getDoc(doc(db, 'artists', uid, 'artworks', id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setArtwork(data);
          setPriceInput((data as any).price || '');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  async function updateField(field: string, value: any) {
    setSavingField(field);
    try {
      await updateDoc(doc(db, 'artists', userId, 'artworks', artworkId), { [field]: value });
      setArtwork((a: any) => ({ ...a, [field]: value }));
    } catch (err) {
      console.error(err);
    } finally {
      setSavingField(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'artists', userId, 'artworks', artworkId));
      router.push('/archive');
    } catch (err) {
      console.error(err);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-6 animate-pulse">
          <div className="h-64 bg-card rounded-2xl" />
          <div className="h-4 bg-card rounded w-1/2" />
          <div className="h-3 bg-card rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-secondary text-sm mb-4">Artwork not found.</div>
          <button onClick={() => router.push('/archive')} className="text-purple-400 text-sm">Back to Archive</button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <ArtworkEdit
        artwork={artwork}
        userId={userId}
        artworkId={artworkId}
        onDone={(updated) => { setArtwork(updated); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const locationLine = artwork.locationType === 'Studio' ? 'Studio'
    : artwork.locationType === 'Gallery' ? (artwork.locationDetail || 'Gallery')
    : artwork.locationType === 'Collector' ? (artwork.locationDetail || 'Collector')
    : artwork.locationType === 'Storage' ? 'Storage'
    : artwork.locationType === 'MuseumLoan' ? 'Museum loan'
    : artwork.locationType === 'Destroyed' ? 'Destroyed'
    : artwork.locationCurrent || 'Unknown';

  const editionLine = !artwork.classification || artwork.classification === 'Unique'
    ? 'Unique' : artwork.classification === 'LimitedEdition'
    ? 'Edition of ' + artwork.editionSize : 'Open edition';

  return (
    <div className="min-h-screen bg-background text-primary pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-secondary text-sm hover:text-primary transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="px-3 py-1.5 border border-default hover:border-purple-700 text-secondary hover:text-primary text-xs rounded-lg transition-all">
              Edit record
            </button>
            <button onClick={() => setConfirmDelete(true)} className="px-3 py-1.5 border border-default hover:border-red-800 text-muted hover:text-red-400 text-xs rounded-lg transition-all">
              Delete
            </button>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12">

          {/* Left: Image */}
          <div className="sm:sticky sm:top-8 self-start">
            {artwork.imageUrl ? (
              <div>
                <img
                  src={artwork.imageUrl} alt={artwork.title}
                  onClick={() => setEnlarged(true)}
                  className="w-full rounded-2xl border border-default hover:border-default transition-all cursor-zoom-in"
                />
                <p className="text-xs text-muted mt-2 text-center">Tap to enlarge</p>
              </div>
            ) : (
              <div className="w-full h-72 bg-card border border-default rounded-2xl flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
            {artwork.originalUrl && (
              <a href={artwork.originalUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 border border-default hover:border-default text-muted hover:text-secondary text-xs rounded-xl transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download full resolution
              </a>
            )}
          </div>

          {/* Right: Details */}
          <div className="space-y-6">

            {/* Hero */}
            <div>
              <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">{artwork.year}</div>
              <h1 className="text-3xl font-bold text-primary mb-2 leading-tight" style={{fontFamily:"var(--font-playfair)"}}>
                {artwork.title || 'Untitled'}
              </h1>
              <p className="text-secondary text-sm">
                {[artwork.medium, artwork.dimensions].filter(Boolean).join(' · ')}
              </p>
            </div>

            {/* Quick actions */}
            <div className="border border-default rounded-2xl divide-y divide-default bg-card">

              {/* Status */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted uppercase tracking-widest">Status</span>
                  {editingStatus ? (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {STATUSES.map(s => (
                        <button key={s} onClick={async () => { await updateField('status', s); setEditingStatus(false); }}
                          className={"text-xs px-3 py-1 rounded-full border transition-all " + (artwork.status === s ? statusColor[s] || 'text-secondary border-gray-700' : 'border-default text-secondary hover:border-purple-700')}>
                          {s}
                        </button>
                      ))}
                      <button onClick={() => setEditingStatus(false)} className="text-xs text-muted hover:text-secondary px-2">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingStatus(true)}
                      className={"text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:opacity-80 " + (statusColor[artwork.status] || 'text-secondary border-gray-700')}>
                      {artwork.status || 'Set status'}
                    </button>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-muted uppercase tracking-widest">Price</span>
                  {editingPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-secondary text-sm">€</span>
                      <input
                        value={priceInput}
                        onChange={e => setPriceInput(e.target.value)}
                        className="bg-card-hover border border-default rounded-lg px-3 py-1.5 text-sm text-primary w-32 focus:outline-none focus:border-purple-700"
                        placeholder="0"
                        autoFocus
                      />
                      <button onClick={async () => { await updateField('price', priceInput); setEditingPrice(false); }}
                        className="text-xs text-purple-400 hover:text-purple-300 px-2">Save</button>
                      <button onClick={() => { setPriceInput(artwork.price || ''); setEditingPrice(false); }}
                        className="text-xs text-muted hover:text-secondary">✕</button>
                    </div>
                  ) : (
                    <button onClick={() => setEditingPrice(true)} className="text-sm font-semibold text-primary hover:text-purple-300 transition-colors">
                      {artwork.price ? '€' + Number(artwork.price).toLocaleString() : <span className="text-muted font-normal text-xs">Set price</span>}
                    </button>
                  )}
                </div>
              </div>

              {/* Location — tap to go to location section */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted uppercase tracking-widest">Location</span>
                  <button onClick={() => { setActiveTab('record'); }} className="text-sm text-primary hover:text-purple-300 transition-colors">
                    {locationLine}
                  </button>
                </div>
              </div>

              {/* Edition */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted uppercase tracking-widest">Edition</span>
                  <span className="text-sm text-primary">{editionLine}</span>
                </div>
              </div>

            </div>

            {/* Tabs */}
            <div>
              <div className="flex border-b border-default mb-4">
                {(['record', 'voice', 'value'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={"px-4 py-2.5 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-px " +
                      (activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-muted hover:text-secondary')}>
                    {tab === 'record' ? 'Record' : tab === 'voice' ? 'Artist\'s voice' : 'Value'}
                  </button>
                ))}
              </div>

              {activeTab === 'record' && (
                <div className="space-y-4">
                  <div className="bg-card border border-default rounded-2xl divide-y divide-default">
                    {[
                      ['Materials', artwork.materials],
                      ['Condition', artwork.condition],
                      ['Technique', artwork.productionTechnique],
                      ['Printer / Foundry', artwork.printer],
                      ['Publisher', artwork.publisher],
                      ['Signature', artwork.signatureDetails],
                      ['Weight', artwork.weight ? artwork.weight + ' kg' : null],
                      ['Certificate', artwork.certificateIssued ? 'Issued' : null],
                    ].filter(p => p[1]).map(pair => (
                      <div key={pair[0] as string} className="flex justify-between px-5 py-3">
                        <span className="text-xs text-muted">{pair[0]}</span>
                        <span className="text-xs text-primary text-right max-w-[60%]">{pair[1]}</span>
                      </div>
                    ))}
                    {![artwork.materials, artwork.condition, artwork.productionTechnique, artwork.printer, artwork.publisher, artwork.signatureDetails, artwork.weight].some(Boolean) && (
                      <div className="px-5 py-6 text-xs text-muted text-center">No catalogue details yet. Tap Edit record to add.</div>
                    )}
                  </div>
                  <div className="bg-card border border-default rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-default">
                      <span className="text-xs text-muted uppercase tracking-widest">Location</span>
                    </div>
                    <div className="p-1"><LocationCard artwork={artwork} /></div>
                  </div>
                  <div className="bg-card border border-default rounded-2xl overflow-hidden">
                    <div className="px-5 py-3 border-b border-default">
                      <span className="text-xs text-muted uppercase tracking-widest">Edition</span>
                    </div>
                    <div className="p-1"><EditionLedger artwork={artwork} userId={userId} /></div>
                  </div>
                </div>
              )}

              {activeTab === 'voice' && (
                <div className="bg-card border border-default rounded-2xl overflow-hidden">
                  <CarolVoice
                    artwork={artwork}
                    userId={userId}
                    artworkId={artworkId}
                    onSaved={(updated) => setArtwork(updated)}
                  />
                </div>
              )}

              {activeTab === 'value' && (
                <div className="bg-card border border-default rounded-2xl overflow-hidden">
                  <Valuation artwork={artwork} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Enlarged image */}
      {enlarged && (
        <div onClick={() => setEnlarged(false)} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out">
          <img src={artwork.imageUrl} alt={artwork.title} className="max-w-full max-h-full object-contain rounded-xl" />
          <button onClick={() => setEnlarged(false)} className="absolute top-4 right-4 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-primary hover:bg-black/80">✕</button>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card border border-default rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl mb-2" style={{fontFamily:"var(--font-playfair)"}}>Delete this artwork?</div>
            <p className="text-secondary text-sm mb-8">This will permanently remove this work and all its records. This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-3 border border-default text-secondary text-sm rounded-xl">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-3 bg-red-800 hover:bg-red-700 disabled:opacity-40 text-white text-sm rounded-xl">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
