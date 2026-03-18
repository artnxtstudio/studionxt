'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

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
  const [edit, setEdit] = useState<any>(artwork);

  function setE(key: string, value: string | boolean) {
    setEdit((d: any) => ({ ...d, [key]: value }));
  }

  const sel = MEDIUMS.find(m => m.label === edit.medium);
  const is3D = sel?.is3D ?? false;
  const isEdition = ['Photography', 'Print'].includes(edit.medium);

  const inputClass = 'w-full bg-[#1E1A16] border border-[#3D3530] text-[#F5F0EB] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const labelClass = 'text-xs text-purple-400 mb-1.5 block';

  async function handleSave() {
    setSaving(true);
    try {
      const three = MEDIUMS.find(m => m.label === edit.medium)?.is3D ?? false;
      const parts = [edit.width, edit.height, three ? edit.depth : ''].filter(Boolean);
      const dimensions = parts.length ? parts.join(' x ') + ' in' : '';
      const updated = { ...edit, dimensions };
      await updateDoc(doc(db, 'artists', userId, 'artworks', artworkId), updated);
      onDone(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0B09] text-[#F5F0EB] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <button onClick={onCancel} className="text-gray-500 text-sm mb-6 hover:text-[#F5F0EB]">Cancel</button>
        <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Editing</div>
        <h1 className="text-2xl font-bold text-[#F5F0EB] mb-6">{artwork.title || 'Untitled'}</h1>
        <div className="flex gap-1.5 mb-8">
          {[1,2,3,4].map(s => (
            <div key={s} className={'h-1 flex-1 rounded-full ' + (s <= step ? 'bg-purple-500' : 'bg-[#222]')}></div>
          ))}
        </div>
        {step === 1 && (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-6 space-y-5">
            <div className="text-sm font-medium text-[#F5F0EB]">The work</div>
            <div>
              <label className={labelClass}>Medium</label>
              <select value={edit.medium || ''} onChange={e => setE('medium', e.target.value)} className={inputClass}>
                <option value="">Select medium...</option>
                {MEDIUMS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Title</label>
              <input value={edit.title || ''} onChange={e => setE('title', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Year</label>
              <input value={edit.year || ''} onChange={e => setE('year', e.target.value)} className={inputClass} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onCancel} className="px-4 py-2 border border-[#3D3530] text-gray-400 text-sm rounded-lg">Cancel</button>
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-2 bg-purple-700 text-[#F5F0EB] text-sm rounded-lg">Next</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-6 space-y-5">
            <div className="text-sm font-medium text-[#F5F0EB]">Dimensions (inches)</div>
            <div className={is3D ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'}>
              <div>
                <label className={labelClass}>Width</label>
                <input value={edit.width || ''} onChange={e => setE('width', e.target.value)} placeholder="in" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Height</label>
                <input value={edit.height || ''} onChange={e => setE('height', e.target.value)} placeholder="in" className={inputClass} />
              </div>
              {is3D && (
                <div>
                  <label className={labelClass}>Depth</label>
                  <input value={edit.depth || ''} onChange={e => setE('depth', e.target.value)} placeholder="in" className={inputClass} />
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>Weight (lbs)</label>
              <input value={edit.weight || ''} onChange={e => setE('weight', e.target.value)} placeholder="lbs" className={inputClass} />
            </div>
            {isEdition && (
              <div className="border-t border-[#2A2318] pt-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={edit.hasEdition || false} onChange={e => setE('hasEdition', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                  <span className="text-sm text-[#F5F0EB]">This is an edition</span>
                </label>
                {edit.hasEdition && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Edition size</label>
                        <input value={edit.editionTotal || ''} onChange={e => setE('editionTotal', e.target.value)} placeholder="e.g. 10" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>APs</label>
                        <input value={edit.editionAPs || ''} onChange={e => setE('editionAPs', e.target.value)} placeholder="e.g. 2" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Editions sold</label>
                      <input value={edit.editionSold || ''} onChange={e => setE('editionSold', e.target.value)} placeholder="e.g. 3" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Who holds the APs</label>
                      <input value={edit.apHolders || ''} onChange={e => setE('apHolders', e.target.value)} placeholder="e.g. Artist, MoMA" className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-[#3D3530] text-gray-400 text-sm rounded-lg">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-2 bg-purple-700 text-[#F5F0EB] text-sm rounded-lg">Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-6 space-y-5">
            <div className="text-sm font-medium text-[#F5F0EB]">Status and pricing</div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={edit.status || 'Available'} onChange={e => setE('status', e.target.value)} className={inputClass}>
                {['Available', 'Sold', 'Consigned', 'Not for sale'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Asking price (USD)</label>
              <input value={edit.price || ''} onChange={e => setE('price', e.target.value)} placeholder="Leave blank if unsure" className={inputClass} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-[#3D3530] text-gray-400 text-sm rounded-lg">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 px-4 py-2 bg-purple-700 text-[#F5F0EB] text-sm rounded-lg">Next</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="bg-[#171410] border border-[#2E2820] rounded-2xl p-6 space-y-5">
            <div className="text-sm font-medium text-[#F5F0EB]">Location and condition</div>
            <div>
              <label className={labelClass}>Where is this work now?</label>
              <input value={edit.locationCurrent || ''} onChange={e => setE('locationCurrent', e.target.value)} placeholder="e.g. Studio, gallery" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Condition</label>
              <select value={edit.condition || 'Good'} onChange={e => setE('condition', e.target.value)} className={inputClass}>
                {['Excellent', 'Good', 'Fair', 'Poor'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Series name</label>
              <input value={edit.seriesName || ''} onChange={e => setE('seriesName', e.target.value)} placeholder="Optional" className={inputClass} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(3)} className="px-4 py-2 border border-[#3D3530] text-gray-400 text-sm rounded-lg">Back</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-purple-700 disabled:opacity-40 text-[#F5F0EB] text-sm rounded-lg">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
