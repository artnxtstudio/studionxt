'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import Valuation from '@/components/PriceIntelligence';
import EditionLedger from '@/components/EditionLedger';
import LocationCard from '@/components/LocationCard';
import { onAuthStateChanged } from 'firebase/auth';
import ArtworkEdit from '@/components/ArtworkEdit';
import CarolVoice from '@/components/CarolVoice';

function Section({ title, summary, complete, children }: {
  title: string;
  summary: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#2A2520] rounded-2xl overflow-hidden bg-[#141210]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#161616] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={'w-2 h-2 rounded-full flex-shrink-0 ' + (complete ? 'bg-green-500' : 'bg-red-500/60')} />
          <span className="text-sm font-medium text-[#F5F0EB]">{title}</span>
          {summary && (
            <span className="text-xs text-gray-500">· {summary}</span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className={'text-gray-600 transition-transform ' + (open ? 'rotate-180' : '')}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && (
        <div className="border-t border-[#221F1C]">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ArtworkPage() {
  const router = useRouter();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enlarged, setEnlarged] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [userId, setUserId] = useState('demo-user');
  const [artworkId, setArtworkId] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id') || '';
    setArtworkId(id);
    if (!id) { setLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        const uid = user?.uid || 'demo-user';
        setUserId(uid);
        const snap = await getDoc(doc(db, 'artists', uid, 'artworks', id));
        if (snap.exists()) setArtwork({ id: snap.id, ...snap.data() });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

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
      <div className="min-h-screen bg-[#0A0908] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-lg px-6 animate-pulse">
          <div className="h-64 bg-[#141210] rounded-2xl" />
          <div className="h-4 bg-[#141210] rounded w-1/2" />
          <div className="h-3 bg-[#141210] rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-[#0A0908] flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-sm mb-4">Artwork not found.</div>
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

  // ── Section summaries and completeness ──
  const aboutFields = [
    artwork.condition, artwork.seriesName, artwork.productionTechnique,
    artwork.printer, artwork.publisher, artwork.signatureDetails, artwork.materials,
  ].filter(Boolean);
  const aboutSummary = artwork.materials || artwork.condition || '';
  const aboutComplete = aboutFields.length > 0;

  const locationType = artwork.locationType || (artwork.locationCurrent ? 'Studio' : '');
  const locationSummary = locationType === 'Studio' ? 'Studio'
    : locationType === 'Gallery' ? (artwork.locationDetail || 'Gallery')
    : locationType === 'Collector' ? (artwork.locationDetail || 'Collector')
    : locationType === 'Storage' ? 'Storage'
    : locationType === 'MuseumLoan' ? 'Museum loan'
    : locationType === 'Destroyed' ? 'Destroyed'
    : artwork.locationCurrent || 'Unknown';
  const locationComplete = !!(locationType && locationType !== 'Unknown');

  const editionSummary = !artwork.classification || artwork.classification === 'Unique'
    ? 'Unique' : artwork.classification === 'LimitedEdition'
    ? 'Edition of ' + artwork.editionSize : 'Open edition';
  const editionComplete = !!artwork.classification;

  const miraSummary = artwork.carolVoice?.statement || artwork.carolVoice?.audio ? 'Recorded' : 'Not recorded';
  const miraComplete = !!(artwork.carolVoice?.statement || artwork.carolVoice?.audio);

  const valueSummary = artwork.valueHistory?.length > 0
    ? '$' + Number(artwork.valueHistory[artwork.valueHistory.length - 1]?.asking || 0).toLocaleString()
    : 'Not checked';
  const valueComplete = !!(artwork.valueHistory?.length > 0);

  const statusColor = artwork.status === 'Sold' ? 'text-green-400 border-green-900 bg-green-900/10'
    : artwork.status === 'Available' ? 'text-purple-400 border-purple-900 bg-purple-900/10'
    : artwork.status === 'Consigned' ? 'text-yellow-400 border-yellow-900 bg-yellow-900/10'
    : 'text-gray-400 border-gray-700';

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#F5F0EB] pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Top bar ── */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="text-gray-500 text-sm hover:text-[#F5F0EB] transition-colors">
            ← Back
          </button>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="px-4 py-2 border border-[#3D3530] hover:border-purple-700 text-gray-400 hover:text-[#F5F0EB] text-xs rounded-lg transition-all">
              Edit
            </button>
            <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 border border-[#3D3530] hover:border-red-700 text-gray-400 hover:text-red-400 text-xs rounded-lg transition-all">
              Delete
            </button>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">

          {/* ── Left: Image ── */}
          <div className="sm:sticky sm:top-8 self-start">
            {artwork.imageUrl ? (
              <div>
                <img
                  src={artwork.imageUrl} alt={artwork.title}
                  onClick={() => setEnlarged(true)}
                  className="w-full rounded-2xl border border-[#2A2520] hover:border-purple-700 transition-all cursor-zoom-in"
                />
                <p className="text-xs text-gray-600 mt-2 text-center">Tap to enlarge</p>
              </div>
            ) : (
              <div className="w-full h-64 bg-[#141210] border border-[#2A2520] rounded-2xl flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            )}
            {artwork.originalUrl && (
              <a href={artwork.originalUrl} target="_blank" rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 border border-[#3D3530] hover:border-purple-700 text-gray-600 hover:text-[#F5F0EB] text-xs rounded-xl transition-all">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download full resolution
              </a>
            )}
          </div>

          {/* ── Right: Hero + Accordions ── */}
          <div className="space-y-4">

            {/* Hero — always visible */}
            <div className="pb-4 border-b border-[#221F1C]">
              <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">{artwork.year}</div>
              <h1 className="text-2xl font-bold text-[#F5F0EB] mb-1" style={{fontFamily:"var(--font-playfair)"}}>
                {artwork.title || 'Untitled'}
              </h1>
              <p className="text-gray-500 text-sm mb-4">
                {artwork.medium}{artwork.dimensions ? ' · ' + artwork.dimensions : ''}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {artwork.status && (
                  <div className={'text-xs px-3 py-1.5 rounded-full border font-medium ' + statusColor}>
                    {artwork.status}
                  </div>
                )}
                {artwork.price && (
                  <div className="text-sm font-semibold text-[#F5F0EB]">
                    ${Number(artwork.price).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* About this work */}
            <Section title="About this work" summary={aboutSummary} complete={aboutComplete}>
              <div className="divide-y divide-[#1a1a1a]">
                {[
                  ['Materials', artwork.materials],
                  ['Condition', artwork.condition],
                  ['Series', artwork.seriesName],
                  ['Technique', artwork.productionTechnique],
                  ['Printer / Foundry', artwork.printer],
                  ['Publisher', artwork.publisher],
                  ['Signature', artwork.signatureDetails],
                  ['Weight', artwork.weight ? artwork.weight + ' lbs' : null],
                ].filter(p => p[1]).map(pair => (
                  <div key={pair[0] as string} className="flex justify-between px-5 py-3">
                    <span className="text-xs text-gray-500">{pair[0]}</span>
                    <span className="text-xs text-[#F5F0EB] font-medium text-right max-w-[60%]">{pair[1]}</span>
                  </div>
                ))}
                {aboutFields.length === 0 && (
                  <div className="px-5 py-4 text-xs text-gray-600">No details added yet. Tap Edit to add.</div>
                )}
              </div>
            </Section>

            {/* Location */}
            <Section title="Location" summary={locationSummary} complete={locationComplete}>
              <div className="p-1">
                <LocationCard artwork={artwork} />
              </div>
            </Section>

            {/* Edition */}
            <Section title="Edition" summary={editionSummary} complete={editionComplete}>
              <div className="p-1">
                <EditionLedger artwork={artwork} userId={userId} />
              </div>
            </Section>

            {/* Mira */}
            <Section title="Mira" summary={miraSummary} complete={miraComplete}>
              <div className="p-1">
                <CarolVoice
                  artwork={artwork}
                  userId={userId}
                  artworkId={artworkId}
                  onSaved={(updated) => setArtwork(updated)}
                />
              </div>
            </Section>

            {/* Value */}
            <Section title="What this is worth" summary={valueSummary} complete={valueComplete}>
              <div className="p-1">
                <Valuation artwork={artwork} />
              </div>
            </Section>

          </div>
        </div>
      </div>

      {/* Enlarged image */}
      {enlarged && (
        <div onClick={() => setEnlarged(false)} className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out">
          <img src={artwork.imageUrl} alt={artwork.title} className="max-w-full max-h-full object-contain rounded-xl" />
          <button onClick={() => setEnlarged(false)} className="absolute top-4 right-4 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-[#F5F0EB] hover:bg-black/80">✕</button>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141210] border border-[#3D3530] rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="text-xl mb-2" style={{fontFamily:"var(--font-playfair)"}}>Delete this artwork?</div>
            <p className="text-gray-500 text-sm mb-8">This will permanently remove this work and cannot be undone.</p>
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
