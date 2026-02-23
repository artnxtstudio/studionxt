'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

async function resizeImage(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

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

const PRINT_MEDIUMS = ['Photography', 'Print'];

export default function Upload() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 1 | 2 | 3 | 4 | 'mira'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [originalUrl, setOriginalUrl] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [saving, setSaving] = useState(false);
  const [miraResponse, setMiraResponse] = useState('');

  const [details, setDetails] = useState({
    medium: '',
    title: '',
    year: new Date().getFullYear().toString(),
    width: '',
    height: '',
    depth: '',
    weight: '',
    hasEdition: false,
    editionTotal: '',
    editionAPs: '',
    editionSold: '',
    apHolders: '',
    status: 'Available',
    price: '',
    locationCurrent: '',
    condition: 'Good',
    seriesName: '',
  });

  function set(key: string, value: string | boolean) {
    setDetails(d => ({ ...d, [key]: value }));
  }

  const selectedMedium = MEDIUMS.find(m => m.label === details.medium);
  const is3D = selectedMedium?.is3D ?? false;
  const isEditionType = PRINT_MEDIUMS.includes(details.medium);
  const unit = 'in';

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');
    try {
      const userId = auth.currentUser?.uid || 'demo-user';
      const timestamp = Date.now();
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setUploadProgress('Uploading original...');
      const originalRef = ref(storage, 'artworks/' + userId + '/originals/' + timestamp + '_' + file.name);
      await uploadBytes(originalRef, file);
      setOriginalUrl(await getDownloadURL(originalRef));
      setUploadProgress('Creating web version...');
      const webBlob = await resizeImage(file, 1200);
      const webRef = ref(storage, 'artworks/' + userId + '/web/' + timestamp + '_' + baseName + '.jpg');
      await uploadBytes(webRef, webBlob);
      setImageUrl(await getDownloadURL(webRef));
      setStep(1);
    } catch (err) {
      console.error(err);
      setUploadProgress('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const userId = auth.currentUser?.uid || 'demo-user';
      const id = Date.now().toString();
      const dimParts = [details.width, details.height, is3D ? details.depth : ''].filter(Boolean);
      const dimensions = dimParts.length ? dimParts.join(' x ') + ' ' + unit : '';
      await setDoc(doc(db, 'artists', userId, 'artworks', id), {
        ...details,
        dimensions,
        imageUrl,
        originalUrl,
        fileSize,
        createdAt: new Date().toISOString(),
        userId,
      });
      const { getDoc } = await import('firebase/firestore');
      const artistDoc = await getDoc(doc(db, 'artists', userId));
      const res = await fetch('/api/mira', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistContext: { profile: artistDoc.data(), artwork: { ...details, imageUrl } },
          query: 'Artist uploaded: ' + (details.title || 'Untitled') + ', ' + details.year + ', ' + details.medium + '. Write one warm sentence acknowledging this work.',
        }),
      });
      const data = await res.json();
      setMiraResponse(data.response || 'Recorded in your archive.');
      setStep('mira');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-colors';
  const labelClass = 'text-xs text-purple-400 mb-1.5 block';

  const steps = [1, 2, 3, 4];
  const currentStep = typeof step === 'number' ? step : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">

        <button onClick={() => router.back()} className="text-gray-500 text-sm mb-6 hover:text-white transition-all">
          Back
        </button>

        <div className="text-xs text-purple-400 uppercase tracking-widest mb-2">Archive</div>
        <h1 className="text-2xl font-bold text-white mb-6">Add Artwork</h1>

        {currentStep && (
          <div className="flex gap-1.5 mb-8">
            {steps.map(s => (
              <div key={s} className={'h-1 flex-1 rounded-full transition-all ' + (s <= currentStep ? 'bg-purple-500' : 'bg-[#222]')} />
            ))}
          </div>
        )}

        {step === 'upload' && (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-[#333] hover:border-purple-600 rounded-2xl p-16 text-center transition-all">
              {uploading ? (
                <div>
                  <div className="text-purple-400 text-sm mb-2 animate-pulse">{uploadProgress || 'Uploading...'}</div>
                  <div className="text-gray-600 text-xs">Do not close this page</div>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-4">⬆</div>
                  <div className="text-white text-sm font-medium mb-2">Upload artwork image</div>
                  <div className="text-gray-400 text-xs mb-4">Original file preserved at full resolution</div>
                  <div className="text-gray-600 text-xs">JPG · PNG · TIFF · No size limit</div>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        )}

        {step === 1 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl overflow-hidden">
            {imageUrl && <img src={imageUrl} alt="Artwork" className="w-full h-48 object-cover" />}
            <div className="p-6 space-y-5">
              <div className="text-xs text-green-400 mb-2">Image uploaded successfully</div>

              <div>
                <label className={labelClass}>Medium</label>
                <select value={details.medium} onChange={e => set('medium', e.target.value)} className={inputClass}>
                  <option value="">Select medium...</option>
                  {MEDIUMS.map(m => (
                    <option key={m.label} value={m.label}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Title</label>
                <input value={details.title} onChange={e => set('title', e.target.value)} placeholder="What is this work called?" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Year</label>
                <input value={details.year} onChange={e => set('year', e.target.value)} placeholder="e.g. 1987" className={inputClass} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep('upload')} className="px-4 py-2 border border-[#333] text-gray-400 text-sm rounded-lg hover:border-gray-500 transition-all">Back</button>
                <button onClick={() => setStep(2)} disabled={!details.medium} className="flex-1 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm rounded-lg transition-all">Next →</button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-5">
            <div>
              <div className="text-sm font-medium text-white mb-1">Dimensions</div>
              <div className="text-xs text-gray-500 mb-4">{is3D ? 'Width × Height × Depth' : 'Width × Height'} · inches</div>
              <div className={is3D ? 'grid grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3'}>
                <div>
                  <label className={labelClass}>Width</label>
                  <input value={details.width} onChange={e => set('width', e.target.value)} placeholder="in" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Height</label>
                  <input value={details.height} onChange={e => set('height', e.target.value)} placeholder="in" className={inputClass} />
                </div>
                {is3D && (
                  <div>
                    <label className={labelClass}>Depth</label>
                    <input value={details.depth} onChange={e => set('depth', e.target.value)} placeholder="in" className={inputClass} />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className={labelClass}>Weight {is3D ? '(lbs)' : '— optional'}</label>
              <input value={details.weight} onChange={e => set('weight', e.target.value)} placeholder={is3D ? 'lbs' : 'Leave blank if not needed'} className={inputClass} />
            </div>

            {isEditionType && (
              <div className="border-t border-[#1a1a1a] pt-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={details.hasEdition} onChange={e => set('hasEdition', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                  <span className="text-sm text-white">This is an edition</span>
                </label>
                {details.hasEdition && (
                  <div className="space-y-4 pl-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Edition size</label>
                        <input value={details.editionTotal} onChange={e => set('editionTotal', e.target.value)} placeholder="e.g. 10" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>APs (artist proofs)</label>
                        <input value={details.editionAPs} onChange={e => set('editionAPs', e.target.value)} placeholder="e.g. 2" className={inputClass} />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Editions sold</label>
                      <input value={details.editionSold} onChange={e => set('editionSold', e.target.value)} placeholder="e.g. 3" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Who holds the APs</label>
                      <input value={details.apHolders} onChange={e => set('apHolders', e.target.value)} placeholder="e.g. Artist, MoMA" className={inputClass} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="px-4 py-2 border border-[#333] text-gray-400 text-sm rounded-lg hover:border-gray-500 transition-all">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all">Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-5">
            <div>
              <div className="text-sm font-medium text-white mb-4">Status and pricing</div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Status</label>
                  <select value={details.status} onChange={e => set('status', e.target.value)} className={inputClass}>
                    {['Available', 'Sold', 'Consigned', 'Not for sale'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {details.hasEdition && details.editionTotal && (
                    <div className="text-xs text-gray-600 mt-1.5">
                      Edition: {details.editionSold || '0'} of {details.editionTotal} sold
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Asking price (USD)</label>
                  <input value={details.price} onChange={e => set('price', e.target.value)} placeholder="Leave blank if unsure" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="px-4 py-2 border border-[#333] text-gray-400 text-sm rounded-lg hover:border-gray-500 transition-all">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all">Next →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-6 space-y-5">
            <div>
              <div className="text-sm font-medium text-white mb-4">Location and condition</div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Where is this work now?</label>
                  <input value={details.locationCurrent} onChange={e => set('locationCurrent', e.target.value)} placeholder="e.g. Studio, collector name, gallery" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Condition</label>
                  <select value={details.condition} onChange={e => set('condition', e.target.value)} className={inputClass}>
                    {['Excellent', 'Good', 'Fair', 'Poor'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Series name — optional</label>
                  <input value={details.seriesName} onChange={e => set('seriesName', e.target.value)} placeholder="Leave blank if not part of a series" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(3)} className="px-4 py-2 border border-[#333] text-gray-400 text-sm rounded-lg hover:border-gray-500 transition-all">Back</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-sm rounded-lg transition-all">
                {saving ? 'Saving...' : 'Save to archive'}
              </button>
            </div>
          </div>
        )}

        {step === 'mira' && (
          <div className="bg-[#111] border border-[#222] rounded-2xl p-8">
            <div className="text-xs text-purple-400 uppercase tracking-widest mb-6">Mira</div>
            <div className="text-gray-300 text-sm leading-relaxed mb-8 bg-[#0a0a0a] rounded-xl p-5 border border-[#1a1a1a]">
              {miraResponse}
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 mb-6">
              <div className="text-xs text-gray-500 mb-1">Original file preserved</div>
              <div className="text-xs text-green-400">Full resolution available for printing and sharing</div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push('/archive')} className="flex-1 px-6 py-3 border border-[#333] text-gray-400 text-sm rounded-lg hover:border-purple-700 transition-all">
                View Archive
              </button>
              <button onClick={() => router.push('/dashboard')} className="flex-1 px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-lg transition-all">
                Go to Studio
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
