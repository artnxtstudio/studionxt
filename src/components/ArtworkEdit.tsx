'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const MEDIUMS = [
  { label: 'Painting', is3D: false },
  { label: 'Drawing', is3D: false },
  { label: 'Photography', is3D: false },
  { label: 'Print', is3D: false },
  { label: 'Sculpture', is3D: true },
  { label: 'Ceramic', is3D: true },
  { label: 'Installation', is3D: true },
  { label: 'Mixed Media', is3D: false },
  { label: 'Digital', is3D: false },
  { label: 'Other', is3D: false },
];

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];
const STATUSES = ['Available', 'Sold', 'Consigned', 'Not for sale'];
const LOCATION_TYPES = ['Studio', 'Gallery', 'Collector', 'Storage', 'MuseumLoan', 'Friend', 'Destroyed', 'Unknown'];

interface Props {
  artwork: any;
  userId: string;
  artworkId: string;
  onDone: (updated: any) => void;
  onCancel: () => void;
}

export default function ArtworkEdit({ artwork, userId, artworkId, onDone, onCancel }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: artwork.title || '',
    medium: artwork.medium || '',
    year: artwork.year || '',
    materials: artwork.materials || '',
    technique: artwork.technique || '',
    width: artwork.width || '',
    height: artwork.height || '',
    depth: artwork.depth || '',
    weight: artwork.weight || '',
    condition: artwork.condition || 'Good',
    status: artwork.status || 'Available',
    seriesName: artwork.seriesName || '',
    locationDetail: artwork.locationDetail || '',
    locationType: artwork.locationType || 'Studio',
    locationContact: artwork.locationContact || '',
    price: artwork.price || '',
  });

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const sel = MEDIUMS.find(m => m.label === form.medium);
  const is3D = sel?.is3D || false;

  async function handleSave() {
    setSaving(true);
    try {
      const updates = { ...form, updatedAt: new Date().toISOString() };
      await updateDoc(doc(db, 'artists', userId, 'artworks', artworkId), updates);
      onDone({ ...artwork, ...updates });
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  const inp = 'w-full bg-background border border-default rounded-xl px-4 py-3 text-sm text-primary focus:outline-none focus:border-purple-500 transition-colors';
  const lbl = 'text-xs text-studio-purple-light uppercase tracking-widest mb-1.5 block';

  const steps = ['The work', 'Dimensions', 'Status', 'Location'];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header with image */}
        <div className="flex items-center gap-4 mb-8">
          {artwork.imageUrl && (
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              className="w-16 h-16 rounded-xl object-cover border border-default flex-shrink-0"
            />
          )}
          <div className="flex-1">
            <div className="text-xs text-studio-purple-light uppercase tracking-widest mb-1">Editing</div>
            <h1 className="text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-playfair)' }}>
              {artwork.title || 'Untitled'}
            </h1>
          </div>
          <button
            onClick={onCancel}
            className="text-secondary hover:text-primary text-sm transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i + 1)}
              className="flex-1 text-center"
            >
              <div className={`h-1 rounded-full mb-1.5 transition-all ${step === i + 1 ? 'bg-purple-600' : step > i + 1 ? 'bg-purple-400' : 'bg-card-hover'}`} />
              <span className={`text-xs hidden sm:block ${step === i + 1 ? 'text-white font-medium' : 'text-muted'}`}>{s}</span>
            </button>
          ))}
        </div>

        {/* Step 1: The work */}
        {step === 1 && (
          <div className="bg-card border border-default rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-primary mb-4">The work</h2>
            <div>
              <label className={lbl}>Medium</label>
              <select value={form.medium} onChange={e => setF('medium', e.target.value)} className={inp}>
                <option value="">Select medium...</option>
                {MEDIUMS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Title</label>
              <input value={form.title} onChange={e => setF('title', e.target.value)} className={inp} placeholder="What is this work called?" />
            </div>
            <div>
              <label className={lbl}>Year</label>
              <input value={form.year} onChange={e => setF('year', e.target.value)} className={inp} placeholder="e.g. 2024" />
            </div>
            <div>
              <label className={lbl}>Materials</label>
              <input value={form.materials} onChange={e => setF('materials', e.target.value)} className={inp} placeholder="e.g. Oil on linen" />
            </div>
            <div>
              <label className={lbl}>Technique</label>
              <input value={form.technique} onChange={e => setF('technique', e.target.value)} className={inp} placeholder="e.g. Impasto" />
            </div>
            <div>
              <label className={lbl}>Series (optional)</label>
              <input value={form.seriesName} onChange={e => setF('seriesName', e.target.value)} className={inp} placeholder="e.g. Landscapes 2024" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onCancel} className="px-5 py-3 border border-default text-secondary text-sm rounded-xl hover:text-primary transition-colors">
                Cancel
              </button>
              <button onClick={() => setStep(2)} className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-xl transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Dimensions */}
        {step === 2 && (
          <div className="bg-card border border-default rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-primary mb-4">Dimensions</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Width (in)</label>
                <input value={form.width} onChange={e => setF('width', e.target.value)} className={inp} placeholder="e.g. 24" />
              </div>
              <div>
                <label className={lbl}>Height (in)</label>
                <input value={form.height} onChange={e => setF('height', e.target.value)} className={inp} placeholder="e.g. 36" />
              </div>
            </div>
            {is3D && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Depth (in)</label>
                  <input value={form.depth} onChange={e => setF('depth', e.target.value)} className={inp} placeholder="e.g. 12" />
                </div>
                <div>
                  <label className={lbl}>Weight (kg)</label>
                  <input value={form.weight} onChange={e => setF('weight', e.target.value)} className={inp} placeholder="e.g. 5" />
                </div>
              </div>
            )}
            <div>
              <label className={lbl}>Condition</label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITIONS.map(c => (
                  <button key={c} onClick={() => setF('condition', c)}
                    className={`py-3 rounded-xl border text-sm transition-all ${form.condition === c ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium' : 'border-default text-secondary hover:border-purple-500'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="px-5 py-3 border border-default text-secondary text-sm rounded-xl hover:text-primary transition-colors">
                ← Back
              </button>
              <button onClick={() => setStep(3)} className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-xl transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Status & Price */}
        {step === 3 && (
          <div className="bg-card border border-default rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-primary mb-4">Status & Price</h2>
            <div>
              <label className={lbl}>Status</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setF('status', s)}
                    className={`py-3 rounded-xl border text-sm transition-all ${form.status === s ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium' : 'border-default text-secondary hover:border-purple-500'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Price (€)</label>
              <input value={form.price} onChange={e => setF('price', e.target.value)} className={inp} placeholder="e.g. 2500" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="px-5 py-3 border border-default text-secondary text-sm rounded-xl hover:text-primary transition-colors">
                ← Back
              </button>
              <button onClick={() => setStep(4)} className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-xl transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Location */}
        {step === 4 && (
          <div className="bg-card border border-default rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-primary mb-4">Location</h2>
            <div>
              <label className={lbl}>Location type</label>
              <div className="grid grid-cols-2 gap-2">
                {LOCATION_TYPES.map(t => (
                  <button key={t} onClick={() => setF('locationType', t)}
                    className={`py-3 rounded-xl border text-sm transition-all ${form.locationType === t ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-medium' : 'border-default text-secondary hover:border-purple-500'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Detail (name of place/person)</label>
              <input value={form.locationDetail} onChange={e => setF('locationDetail', e.target.value)} className={inp} placeholder="e.g. Galerie Schmidt" />
            </div>
            <div>
              <label className={lbl}>Contact</label>
              <input value={form.locationContact} onChange={e => setF('locationContact', e.target.value)} className={inp} placeholder="e.g. info@galerie.de" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(3)} className="px-5 py-3 border border-default text-secondary text-sm rounded-xl hover:text-primary transition-colors">
                ← Back
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
